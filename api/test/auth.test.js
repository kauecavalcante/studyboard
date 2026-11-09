import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer } from './helpers.js';

describe('autenticação', () => {
  let t;
  before(async () => { t = await startTestServer(); });
  after(async () => { await t.close(); });

  const body = { name: 'Ana Souza', email: 'ana@exemplo.com', password: 'segredo123' };

  it('cadastra um usuário e devolve token sem expor a senha', async () => {
    const res = await t.request('POST', '/auth/register', { body });
    assert.equal(res.status, 201);
    assert.ok(res.data.token);
    assert.equal(res.data.user.email, 'ana@exemplo.com');
    assert.equal(JSON.stringify(res.data).includes('passwordHash'), false);
  });

  it('rejeita e-mail já cadastrado', async () => {
    const res = await t.request('POST', '/auth/register', { body });
    assert.equal(res.status, 409);
  });

  it('valida os campos do cadastro', async () => {
    const res = await t.request('POST', '/auth/register', { body: { name: 'A', email: 'x', password: '1' } });
    assert.equal(res.status, 400);
  });

  it('faz login com credenciais corretas', async () => {
    const res = await t.request('POST', '/auth/login', { body: { email: body.email, password: body.password } });
    assert.equal(res.status, 200);
    assert.ok(res.data.token);
  });

  it('nega login sem revelar qual campo está errado', async () => {
    const wrongPassword = await t.request('POST', '/auth/login', { body: { email: body.email, password: 'errada' } });
    const wrongEmail = await t.request('POST', '/auth/login', { body: { email: 'outro@exemplo.com', password: 'errada' } });
    assert.equal(wrongPassword.status, 401);
    assert.equal(wrongEmail.status, 401);
    assert.equal(wrongPassword.data.error, wrongEmail.data.error);
  });

  it('exige token nas rotas protegidas', async () => {
    assert.equal((await t.request('GET', '/groups')).status, 401);
    assert.equal((await t.request('GET', '/groups', { token: 'invalido' })).status, 401);
  });
});
