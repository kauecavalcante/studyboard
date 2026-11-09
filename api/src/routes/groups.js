import { Router } from 'express';
import crypto from 'node:crypto';
import { getDb } from '../db.js';
import { HttpError, toId } from '../errors.js';
import { requireAuth } from '../auth.js';
import { subscribeUser, unsubscribeUser } from '../realtime.js';
import { rooms } from '../rooms.js';

const router = Router();
router.use(requireAuth);

const newInviteCode = () => crypto.randomBytes(4).toString('hex');

function serializeGroup(group, userId) {
  const me = group.members.find((m) => m.userId.equals(userId));
  return {
    id: String(group._id),
    name: group.name,
    description: group.description,
    conversationId: String(group.conversationId),
    role: me?.role ?? null,
    memberCount: group.members.length,
    createdAt: group.createdAt.toISOString(),
  };
}

export async function requireMember(groupId, userId) {
  const group = await getDb()
    .collection('groups')
    .findOne({ _id: toId(groupId), 'members.userId': userId });
  if (!group) throw new HttpError(403, 'Você não participa deste grupo');
  return group;
}

async function requireAdmin(groupId, userId) {
  const group = await requireMember(groupId, userId);
  const me = group.members.find((m) => m.userId.equals(userId));
  if (me.role !== 'admin') throw new HttpError(403, 'Apenas o administrador pode fazer isso');
  return group;
}

async function addMember(io, group, userId) {
  const db = getDb();
  const joinedAt = new Date();
  await db.collection('groups').updateOne(
    { _id: group._id },
    { $push: { members: { userId, role: 'member', joinedAt } } },
  );
  await db.collection('conversations').updateOne(
    { _id: group.conversationId },
    { $push: { participants: { userId, role: 'member', joinedAt } } },
  );
  subscribeUser(io, userId, { conversationId: group.conversationId, groupId: group._id });
  io.to(rooms.user(userId)).emit('groups:changed');
  io.to(rooms.group(group._id)).emit('group:members', { groupId: String(group._id) });
}

router.post('/', async (req, res) => {
  const { name, description } = req.body || {};
  if (typeof name !== 'string' || name.trim().length < 2) throw new HttpError(400, 'Informe o nome do grupo');
  if (name.trim().length > 80) throw new HttpError(400, 'Nome muito longo');

  const db = getDb();
  const now = new Date();
  const member = { userId: req.user.id, role: 'admin', joinedAt: now };

  const conversation = {
    type: 'group',
    groupId: null,
    directKey: null,
    participants: [member],
    lastMessage: null,
    createdAt: now,
  };
  const { insertedId: conversationId } = await db.collection('conversations').insertOne(conversation);

  const group = {
    name: name.trim(),
    description: typeof description === 'string' ? description.trim().slice(0, 300) : '',
    inviteCode: newInviteCode(),
    conversationId,
    members: [member],
    createdAt: now,
  };
  group._id = (await db.collection('groups').insertOne(group)).insertedId;
  await db.collection('conversations').updateOne({ _id: conversationId }, { $set: { groupId: group._id } });

  subscribeUser(req.app.get('io'), req.user.id, { conversationId, groupId: group._id });
  res.status(201).json({ group: serializeGroup(group, req.user.id) });
});

router.get('/', async (req, res) => {
  const groups = await getDb()
    .collection('groups')
    .find({ 'members.userId': req.user.id })
    .sort({ createdAt: 1 })
    .toArray();
  res.json({ groups: groups.map((g) => serializeGroup(g, req.user.id)) });
});

router.post('/join', async (req, res) => {
  const code = typeof req.body?.code === 'string' ? req.body.code.trim().toLowerCase() : '';
  const group = code ? await getDb().collection('groups').findOne({ inviteCode: code }) : null;
  if (!group) throw new HttpError(404, 'Código de convite inválido');

  if (!group.members.some((m) => m.userId.equals(req.user.id))) {
    await addMember(req.app.get('io'), group, req.user.id);
  }
  const updated = await getDb().collection('groups').findOne({ _id: group._id });
  res.json({ group: serializeGroup(updated, req.user.id) });
});

router.get('/:id', async (req, res) => {
  const group = await requireMember(req.params.id, req.user.id);
  const users = await getDb()
    .collection('users')
    .find({ _id: { $in: group.members.map((m) => m.userId) } })
    .toArray();
  const byId = new Map(users.map((u) => [String(u._id), u]));

  const isAdmin = group.members.some((m) => m.userId.equals(req.user.id) && m.role === 'admin');
  res.json({
    group: {
      ...serializeGroup(group, req.user.id),
      inviteCode: isAdmin ? group.inviteCode : null,
      members: group.members.map((m) => ({
        userId: String(m.userId),
        name: byId.get(String(m.userId))?.name ?? 'Usuário removido',
        email: byId.get(String(m.userId))?.email ?? null,
        role: m.role,
        joinedAt: m.joinedAt.toISOString(),
      })),
    },
  });
});

router.post('/:id/members', async (req, res) => {
  const group = await requireAdmin(req.params.id, req.user.id);
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const user = email ? await getDb().collection('users').findOne({ email }) : null;
  if (!user) throw new HttpError(404, 'Nenhum usuário cadastrado com este e-mail');
  if (group.members.some((m) => m.userId.equals(user._id))) throw new HttpError(409, 'Usuário já está no grupo');

  await addMember(req.app.get('io'), group, user._id);
  res.status(201).json({ ok: true });
});

router.delete('/:id/members/:userId', async (req, res) => {
  const group = await requireAdmin(req.params.id, req.user.id);
  const target = toId(req.params.userId);
  const member = group.members.find((m) => m.userId.equals(target));
  if (!member) throw new HttpError(404, 'Membro não encontrado');
  if (member.role === 'admin') throw new HttpError(400, 'O administrador não pode ser removido');

  const db = getDb();
  await db.collection('groups').updateOne({ _id: group._id }, { $pull: { members: { userId: target } } });
  await db
    .collection('conversations')
    .updateOne({ _id: group.conversationId }, { $pull: { participants: { userId: target } } });
  const io = req.app.get('io');
  unsubscribeUser(io, target, { conversationId: group.conversationId, groupId: group._id });
  io.to(rooms.user(target)).emit('groups:changed');
  io.to(rooms.group(group._id)).emit('group:members', { groupId: String(group._id) });
  res.json({ ok: true });
});

export default router;
