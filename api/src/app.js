import http from 'node:http';
import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { errorHandler } from './errors.js';
import { createRealtime } from './realtime.js';
import authRoutes from './routes/auth.js';
import groupRoutes from './routes/groups.js';
import conversationRoutes from './routes/conversations.js';
import taskRoutes from './routes/tasks.js';

export function createServer() {
  const app = express();
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: '50kb' }));

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/api/auth', authRoutes);
  app.use('/api/groups', groupRoutes);
  app.use('/api/conversations', conversationRoutes);
  app.use('/api', taskRoutes);
  app.use('/api', (req, res) => res.status(404).json({ error: 'Rota não encontrada' }));
  app.use(errorHandler);

  const server = http.createServer(app);
  const io = createRealtime(server);
  app.set('io', io);
  return { app, server, io };
}
