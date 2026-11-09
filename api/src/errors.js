import { ObjectId } from 'mongodb';

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function toId(value, status = 404, message = 'Recurso não encontrado') {
  if (typeof value !== 'string' || !ObjectId.isValid(value) || String(new ObjectId(value)) !== value) {
    throw new HttpError(status, message);
  }
  return new ObjectId(value);
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON inválido' });
  console.error(err);
  res.status(500).json({ error: 'Erro interno do servidor' });
}
