import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../db.js';
import { HttpError } from '../errors.js';
import { publicUser, requireAuth, signToken } from '../auth.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const router = Router();

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body || {};
  if (typeof name !== 'string' || name.trim().length < 2) throw new HttpError(400, 'Informe seu nome');
  if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) throw new HttpError(400, 'E-mail inválido');
  if (typeof password !== 'string' || password.length < 6) {
    throw new HttpError(400, 'A senha deve ter ao menos 6 caracteres');
  }

  const users = getDb().collection('users');
  const normalized = email.trim().toLowerCase();
  if (await users.findOne({ email: normalized })) throw new HttpError(409, 'E-mail já cadastrado');

  const user = {
    name: name.trim(),
    email: normalized,
    passwordHash: await bcrypt.hash(password, 10),
    createdAt: new Date(),
  };
  try {
    user._id = (await users.insertOne(user)).insertedId;
  } catch (err) {
    if (err.code === 11000) throw new HttpError(409, 'E-mail já cadastrado');
    throw err;
  }
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  const invalid = new HttpError(401, 'E-mail ou senha incorretos');
  if (typeof email !== 'string' || typeof password !== 'string') throw invalid;

  const user = await getDb().collection('users').findOne({ email: email.trim().toLowerCase() });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) throw invalid;
  res.json({ token: signToken(user), user: publicUser(user) });
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await getDb().collection('users').findOne({ _id: req.user.id });
  if (!user) throw new HttpError(401, 'Autenticação necessária');
  res.json({ user: publicUser(user) });
});

export default router;
