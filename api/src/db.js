import { MongoClient } from 'mongodb';

let client;
let database;

export function getDb() {
  if (!database) throw new Error('Banco de dados não conectado');
  return database;
}

export async function connect(url, name) {
  client = new MongoClient(url);
  await client.connect();
  database = client.db(name);
  await ensureIndexes(database);
  return database;
}

export async function disconnect() {
  await client?.close();
  client = undefined;
  database = undefined;
}

async function ensureIndexes(db) {
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  await db.collection('groups').createIndex({ 'members.userId': 1 });
  await db.collection('groups').createIndex({ inviteCode: 1 }, { unique: true });
  await db.collection('conversations').createIndex({ 'participants.userId': 1 });
  await db.collection('conversations').createIndex(
    { directKey: 1 },
    { unique: true, partialFilterExpression: { directKey: { $type: 'string' } } },
  );
  await db.collection('messages').createIndex({ conversationId: 1, createdAt: -1, _id: -1 });
  await db.collection('tasks').createIndex({ groupId: 1, status: 1 });
}
