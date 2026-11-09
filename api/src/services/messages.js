import { getDb } from '../db.js';
import { HttpError, toId } from '../errors.js';
import { MAX_MESSAGE_LENGTH, PAGE_SIZE } from '../config.js';
import { rooms } from '../rooms.js';

export function serializeMessage(message) {
  return {
    id: String(message._id),
    conversationId: String(message.conversationId),
    senderId: String(message.senderId),
    senderName: message.senderName,
    text: message.text,
    type: message.type,
    createdAt: message.createdAt.toISOString(),
  };
}

export async function requireParticipant(conversationId, userId) {
  const id = toId(conversationId);
  const conversation = await getDb()
    .collection('conversations')
    .findOne({ _id: id, 'participants.userId': userId });
  if (!conversation) throw new HttpError(403, 'Você não participa desta conversa');
  return conversation;
}

export function validateText(text) {
  if (typeof text !== 'string') throw new HttpError(400, 'Texto da mensagem é obrigatório');
  const clean = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim();
  if (!clean) throw new HttpError(400, 'A mensagem não pode ser vazia');
  if (clean.length > MAX_MESSAGE_LENGTH) {
    throw new HttpError(400, `A mensagem deve ter no máximo ${MAX_MESSAGE_LENGTH} caracteres`);
  }
  return clean;
}

export async function sendMessage(io, user, conversationId, text) {
  const conversation = await requireParticipant(conversationId, user.id);
  const clean = validateText(text);
  const db = getDb();

  const message = {
    conversationId: conversation._id,
    senderId: user.id,
    senderName: user.name,
    text: clean,
    type: 'text',
    createdAt: new Date(),
  };
  const { insertedId } = await db.collection('messages').insertOne(message);
  message._id = insertedId;

  await db.collection('conversations').updateOne(
    { _id: conversation._id },
    { $set: { lastMessage: { text: clean, senderId: user.id, createdAt: message.createdAt } } },
  );

  const payload = serializeMessage(message);
  io?.to(rooms.conversation(conversation._id)).emit('message:new', payload);
  return payload;
}

export async function listMessages(conversationId, userId, { before, limit } = {}) {
  const conversation = await requireParticipant(conversationId, userId);
  const db = getDb();
  const size = Math.min(Math.max(Number.parseInt(limit, 10) || PAGE_SIZE, 1), 100);

  const filter = { conversationId: conversation._id };
  if (before) {
    const cursor = await db
      .collection('messages')
      .findOne({ _id: toId(before, 400, 'Cursor inválido'), conversationId: conversation._id });
    if (!cursor) throw new HttpError(400, 'Cursor inválido');
    filter.$or = [
      { createdAt: { $lt: cursor.createdAt } },
      { createdAt: cursor.createdAt, _id: { $lt: cursor._id } },
    ];
  }

  const found = await db
    .collection('messages')
    .find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .limit(size + 1)
    .toArray();

  const hasMore = found.length > size;
  const page = found.slice(0, size).reverse();
  return {
    messages: page.map(serializeMessage),
    nextCursor: hasMore ? String(page[0]._id) : null,
  };
}
