import { Router } from 'express';
import { getDb } from '../db.js';
import { HttpError, toId } from '../errors.js';
import { requireAuth } from '../auth.js';
import { rooms } from '../rooms.js';
import { requireMember } from './groups.js';

export const STATUSES = ['todo', 'doing', 'done'];
export const PRIORITIES = ['high', 'medium', 'low'];

const router = Router();
router.use(requireAuth);

function serializeTask(task) {
  return {
    id: String(task._id),
    groupId: String(task.groupId),
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    assigneeId: task.assigneeId ? String(task.assigneeId) : null,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    sourceMessageId: task.sourceMessageId ? String(task.sourceMessageId) : null,
    createdBy: String(task.createdBy),
    createdAt: task.createdAt.toISOString(),
  };
}

function notify(req, groupId) {
  req.app.get('io')?.to(rooms.group(groupId)).emit('task:changed', { groupId: String(groupId) });
}

function parseTitle(value) {
  if (typeof value !== 'string' || !value.trim()) throw new HttpError(400, 'Informe o título da tarefa');
  if (value.trim().length > 140) throw new HttpError(400, 'Título muito longo');
  return value.trim();
}

function parseDate(value) {
  if (value === undefined || value === null || value === '') return null;
  const date = new Date(value);
  if (typeof value !== 'string' || Number.isNaN(date.getTime())) throw new HttpError(400, 'Prazo inválido');
  return date;
}

function assertMember(group, userId) {
  if (!group.members.some((m) => m.userId.equals(userId))) {
    throw new HttpError(400, 'O responsável precisa ser membro do grupo');
  }
}

router.get('/groups/:groupId/tasks', async (req, res) => {
  const group = await requireMember(req.params.groupId, req.user.id);
  const tasks = await getDb()
    .collection('tasks')
    .find({ groupId: group._id })
    .sort({ createdAt: 1 })
    .toArray();
  res.json({ tasks: tasks.map(serializeTask) });
});

router.post('/groups/:groupId/tasks', async (req, res) => {
  const group = await requireMember(req.params.groupId, req.user.id);
  const body = req.body || {};
  const db = getDb();

  const priority = body.priority ?? 'medium';
  if (!PRIORITIES.includes(priority)) throw new HttpError(400, 'Prioridade inválida');

  let assigneeId = null;
  if (body.assigneeId) {
    assigneeId = toId(body.assigneeId, 400, 'Responsável inválido');
    assertMember(group, assigneeId);
  }

  let sourceMessageId = null;
  if (body.sourceMessageId) {
    sourceMessageId = toId(body.sourceMessageId, 400, 'Mensagem inválida');
    const source = await db
      .collection('messages')
      .findOne({ _id: sourceMessageId, conversationId: group.conversationId });
    if (!source) throw new HttpError(400, 'A mensagem não pertence a este grupo');
  }

  const task = {
    groupId: group._id,
    title: parseTitle(body.title),
    description: typeof body.description === 'string' ? body.description.trim().slice(0, 1000) : '',
    status: 'todo',
    priority,
    assigneeId,
    dueDate: parseDate(body.dueDate),
    sourceMessageId,
    createdBy: req.user.id,
    createdAt: new Date(),
  };
  task._id = (await db.collection('tasks').insertOne(task)).insertedId;
  notify(req, group._id);
  res.status(201).json({ task: serializeTask(task) });
});

async function loadTask(req) {
  const task = await getDb().collection('tasks').findOne({ _id: toId(req.params.id) });
  if (!task) throw new HttpError(404, 'Tarefa não encontrada');
  const group = await requireMember(String(task.groupId), req.user.id);
  return { task, group };
}

router.patch('/tasks/:id', async (req, res) => {
  const { task, group } = await loadTask(req);
  const body = req.body || {};
  const changes = {};

  if ('title' in body) changes.title = parseTitle(body.title);
  if ('description' in body) {
    changes.description = typeof body.description === 'string' ? body.description.trim().slice(0, 1000) : '';
  }
  if ('status' in body) {
    if (!STATUSES.includes(body.status)) throw new HttpError(400, 'Status inválido');
    changes.status = body.status;
  }
  if ('priority' in body) {
    if (!PRIORITIES.includes(body.priority)) throw new HttpError(400, 'Prioridade inválida');
    changes.priority = body.priority;
  }
  if ('dueDate' in body) changes.dueDate = parseDate(body.dueDate);
  if ('assigneeId' in body) {
    if (body.assigneeId) {
      changes.assigneeId = toId(body.assigneeId, 400, 'Responsável inválido');
      assertMember(group, changes.assigneeId);
    } else {
      changes.assigneeId = null;
    }
  }

  const updated = await getDb()
    .collection('tasks')
    .findOneAndUpdate({ _id: task._id }, { $set: changes }, { returnDocument: 'after' });
  notify(req, group._id);
  res.json({ task: serializeTask(updated) });
});

router.delete('/tasks/:id', async (req, res) => {
  const { task, group } = await loadTask(req);
  await getDb().collection('tasks').deleteOne({ _id: task._id });
  notify(req, group._id);
  res.json({ ok: true });
});

export default router;
