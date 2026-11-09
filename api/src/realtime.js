import { Server } from 'socket.io';
import { config } from './config.js';
import { getDb } from './db.js';
import { verifyToken } from './auth.js';
import { sendMessage } from './services/messages.js';
import { rooms } from './rooms.js';

export function createRealtime(httpServer) {
  const io = new Server(httpServer, { cors: { origin: config.corsOrigin } });

  io.use((socket, next) => {
    const user = verifyToken(socket.handshake.auth?.token);
    if (!user) return next(new Error('unauthorized'));
    socket.data.user = user;
    next();
  });

  io.on('connection', async (socket) => {
    const user = socket.data.user;
    socket.join(rooms.user(user.id));

    const db = getDb();
    const conversations = await db
      .collection('conversations')
      .find({ 'participants.userId': user.id }, { projection: { _id: 1 } })
      .toArray();
    const groups = await db
      .collection('groups')
      .find({ 'members.userId': user.id }, { projection: { _id: 1 } })
      .toArray();
    socket.join(conversations.map((c) => rooms.conversation(c._id)));
    socket.join(groups.map((g) => rooms.group(g._id)));

    socket.on('message:send', async (payload, ack) => {
      const reply = typeof ack === 'function' ? ack : () => {};
      try {
        const message = await sendMessage(io, user, payload?.conversationId, payload?.text);
        reply({ ok: true, message });
      } catch (err) {
        reply({ ok: false, status: err.status || 500, error: err.status ? err.message : 'Erro interno' });
      }
    });
  });

  return io;
}

export function subscribeUser(io, userId, { conversationId, groupId }) {
  const list = [];
  if (conversationId) list.push(rooms.conversation(conversationId));
  if (groupId) list.push(rooms.group(groupId));
  io.in(rooms.user(userId)).socketsJoin(list);
}

export function unsubscribeUser(io, userId, { conversationId, groupId }) {
  const list = [];
  if (conversationId) list.push(rooms.conversation(conversationId));
  if (groupId) list.push(rooms.group(groupId));
  io.in(rooms.user(userId)).socketsLeave(list);
}
