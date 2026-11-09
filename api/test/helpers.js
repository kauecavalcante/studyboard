import { io as connectClient } from 'socket.io-client';
import { config } from '../src/config.js';
import { connect, disconnect, getDb } from '../src/db.js';
import { createServer } from '../src/app.js';

export async function startTestServer() {
  const dbName = `studyboard_test_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  await connect(config.mongoUrl, dbName);
  const { server, io } = createServer();
  await new Promise((resolve) => server.listen(0, resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  async function request(method, path, { token, body } = {}) {
    const res = await fetch(`${baseUrl}/api${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  }

  let counter = 0;
  async function createUser(name = 'Usuário') {
    counter += 1;
    const email = `user${counter}_${Math.floor(Math.random() * 1e6)}@teste.com`;
    const { data } = await request('POST', '/auth/register', {
      body: { name: `${name} ${counter}`, email, password: 'segredo123' },
    });
    return { token: data.token, ...data.user };
  }

  function socketFor(token) {
    return new Promise((resolve, reject) => {
      const socket = connectClient(baseUrl, { auth: { token }, transports: ['websocket'] });
      socket.on('connect', () => resolve(socket));
      socket.on('connect_error', reject);
    });
  }

  async function close() {
    await getDb().dropDatabase();
    io.close();
    await disconnect();
  }

  return { baseUrl, request, createUser, socketFor, close };
}
