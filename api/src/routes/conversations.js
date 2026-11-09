import { Router } from 'express';
import { getDb } from '../db.js';
import { HttpError, toId } from '../errors.js';
import { requireAuth } from '../auth.js';
import { subscribeUser } from '../realtime.js';
import { listMessages, sendMessage } from '../services/messages.js';

const router = Router();
router.use(requireAuth);

async function serializeConversations(conversations, userId) {
  const db = getDb();
  const groupIds = conversations.filter((c) => c.type === 'group').map((c) => c.groupId);
  const groups = await db.collection('groups').find({ _id: { $in: groupIds } }).toArray();
  const groupById = new Map(groups.map((g) => [String(g._id), g]));

  const otherIds = conversations
    .filter((c) => c.type === 'direct')
    .map((c) => c.participants.find((p) => !p.userId.equals(userId))?.userId)
    .filter(Boolean);
  const users = await db.collection('users').find({ _id: { $in: otherIds } }).toArray();
  const userById = new Map(users.map((u) => [String(u._id), u]));

  return conversations.map((c) => {
    const base = {
      id: String(c._id),
      type: c.type,
      lastMessage: c.lastMessage
        ? {
            text: c.lastMessage.text,
            senderId: String(c.lastMessage.senderId),
            createdAt: c.lastMessage.createdAt.toISOString(),
          }
        : null,
    };
    if (c.type === 'group') {
      const group = groupById.get(String(c.groupId));
      return { ...base, groupId: String(c.groupId), title: group?.name ?? 'Grupo' };
    }
    const other = c.participants.find((p) => !p.userId.equals(userId));
    const user = other && userById.get(String(other.userId));
    return { ...base, groupId: null, title: user?.name ?? 'Usuário', otherUserId: other ? String(other.userId) : null };
  });
}

router.get('/', async (req, res) => {
  const conversations = await getDb()
    .collection('conversations')
    .find({ 'participants.userId': req.user.id })
    .toArray();
  const items = await serializeConversations(conversations, req.user.id);
  items.sort((a, b) => (b.lastMessage?.createdAt ?? '').localeCompare(a.lastMessage?.createdAt ?? ''));
  res.json({ conversations: items });
});

router.post('/direct', async (req, res) => {
  const otherId = toId(req.body?.userId, 400, 'Usuário inválido');
  if (otherId.equals(req.user.id)) throw new HttpError(400, 'Não é possível conversar consigo mesmo');

  const db = getDb();
  if (!(await db.collection('users').findOne({ _id: otherId }))) throw new HttpError(404, 'Usuário não encontrado');

  const shared = await db.collection('groups').findOne({
    $and: [{ 'members.userId': req.user.id }, { 'members.userId': otherId }],
  });
  if (!shared) throw new HttpError(403, 'Vocês precisam compartilhar um grupo para conversar');

  const directKey = [String(req.user.id), String(otherId)].sort().join('_');
  const now = new Date();
  const conversation = await db.collection('conversations').findOneAndUpdate(
    { directKey },
    {
      $setOnInsert: {
        type: 'direct',
        groupId: null,
        directKey,
        participants: [
          { userId: req.user.id, role: 'member', joinedAt: now },
          { userId: otherId, role: 'member', joinedAt: now },
        ],
        lastMessage: null,
        createdAt: now,
      },
    },
    { upsert: true, returnDocument: 'after' },
  );

  const io = req.app.get('io');
  subscribeUser(io, req.user.id, { conversationId: conversation._id });
  subscribeUser(io, otherId, { conversationId: conversation._id });

  const [item] = await serializeConversations([conversation], req.user.id);
  res.json({ conversation: item });
});

router.get('/:id/messages', async (req, res) => {
  res.json(await listMessages(req.params.id, req.user.id, req.query));
});

router.post('/:id/messages', async (req, res) => {
  const message = await sendMessage(req.app.get('io'), req.user, req.params.id, req.body?.text);
  res.status(201).json({ message });
});

export default router;
