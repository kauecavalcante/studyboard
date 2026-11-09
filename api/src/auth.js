import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { config } from './config.js';
import { HttpError } from './errors.js';

export function signToken(user) {
  return jwt.sign({ sub: String(user._id), name: user.name }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

export function verifyToken(token) {
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    return { id: new ObjectId(payload.sub), name: payload.name };
  } catch {
    return null;
  }
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  const user = scheme === 'Bearer' && token ? verifyToken(token) : null;
  if (!user) throw new HttpError(401, 'Autenticação necessária');
  req.user = user;
  next();
}

export function publicUser(user) {
  return { id: String(user._id), name: user.name, email: user.email };
}
