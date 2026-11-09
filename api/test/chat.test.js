import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer } from './helpers.js';

describe('grupos e conversas', () => {
  let t;
  let ana;
  let bruno;
  let carla;
  let group;

  before(async () => {
    t = await startTestServer();
    ana = await t.createUser('Ana');
    bruno = await t.createUser('Bruno');
    carla = await t.createUser('Carla');
    const res = await t.request('POST', '/groups', { token: ana.token, body: { name: 'Projeto Final' } });
    group = res.data.group;
  });
  after(async () => { await t.close(); });

  const send = (token, conversationId, text) =>
    t.request('POST', `/conversations/${conversationId}/messages`, { token, body: { text } });

  it('cria o grupo com o criador como administrador', () => {
    assert.equal(group.role, 'admin');
    assert.ok(group.conversationId);
  });

  it('permite entrar no grupo por código de convite', async () => {
    const info = await t.request('GET', `/groups/${group.id}`, { token: ana.token });
    const res = await t.request('POST', '/groups/join', { token: bruno.token, body: { code: info.data.group.inviteCode } });
    assert.equal(res.status, 200);
    assert.equal(res.data.group.memberCount, 2);
  });

  it('rejeita código de convite inválido', async () => {
    const res = await t.request('POST', '/groups/join', { token: carla.token, body: { code: 'zzzzzzzz' } });
    assert.equal(res.status, 404);
  });

  it('CA01: grava a mensagem enviada por um participante', async () => {
    const res = await send(ana.token, group.conversationId, '  Olá, pessoal!  ');
    assert.equal(res.status, 201);
    assert.equal(res.data.message.text, 'Olá, pessoal!');
    assert.equal(res.data.message.senderId, ana.id);
  });

  it('CA07: nega leitura e envio a quem não participa', async () => {
    const read = await t.request('GET', `/conversations/${group.conversationId}/messages`, { token: carla.token });
    assert.equal(read.status, 403);
    assert.equal((await send(carla.token, group.conversationId, 'oi')).status, 403);
  });

  it('CA08: nega acesso sem token', async () => {
    const res = await t.request('GET', `/conversations/${group.conversationId}/messages`);
    assert.equal(res.status, 401);
  });

  it('CA09: rejeita mensagem vazia ou longa demais', async () => {
    assert.equal((await send(ana.token, group.conversationId, '   ')).status, 400);
    assert.equal((await send(ana.token, group.conversationId, 'a'.repeat(2001))).status, 400);
    assert.equal((await send(ana.token, group.conversationId, 'a'.repeat(2000))).status, 201);
  });

  it('CA03, CA04 e CA05: consulta ordenada e paginada sem repetir nem pular mensagens', async () => {
    const conv = await t.request('POST', '/groups', { token: bruno.token, body: { name: 'Paginação' } });
    const id = conv.data.group.conversationId;
    for (let i = 1; i <= 120; i += 1) await send(bruno.token, id, `mensagem ${i}`);

    const first = await t.request('GET', `/conversations/${id}/messages`, { token: bruno.token });
    assert.equal(first.data.messages.length, 50);
    assert.equal(first.data.messages[0].text, 'mensagem 71');
    assert.equal(first.data.messages.at(-1).text, 'mensagem 120');
    assert.ok(first.data.nextCursor);

    const second = await t.request('GET', `/conversations/${id}/messages?before=${first.data.nextCursor}`, { token: bruno.token });
    assert.equal(second.data.messages.length, 50);
    assert.equal(second.data.messages.at(-1).text, 'mensagem 70');

    const third = await t.request('GET', `/conversations/${id}/messages?before=${second.data.nextCursor}`, { token: bruno.token });
    assert.equal(third.data.messages.length, 20);
    assert.equal(third.data.nextCursor, null);

    const all = [...third.data.messages, ...second.data.messages, ...first.data.messages];
    assert.equal(new Set(all.map((m) => m.id)).size, 120);
    all.forEach((m, i) => assert.equal(m.text, `mensagem ${i + 1}`));
  });

  it('CA10: reaproveita a mesma conversa direta nos dois sentidos', async () => {
    const a = await t.request('POST', '/conversations/direct', { token: ana.token, body: { userId: bruno.id } });
    const a2 = await t.request('POST', '/conversations/direct', { token: ana.token, body: { userId: bruno.id } });
    const b = await t.request('POST', '/conversations/direct', { token: bruno.token, body: { userId: ana.id } });
    assert.equal(a.status, 200);
    assert.equal(a.data.conversation.id, a2.data.conversation.id);
    assert.equal(a.data.conversation.id, b.data.conversation.id);
  });

  it('só permite conversa direta entre quem compartilha um grupo', async () => {
    const res = await t.request('POST', '/conversations/direct', { token: ana.token, body: { userId: carla.id } });
    assert.equal(res.status, 403);
  });

  it('a conversa direta é visível apenas para os dois participantes', async () => {
    const direct = await t.request('POST', '/conversations/direct', { token: ana.token, body: { userId: bruno.id } });
    const id = direct.data.conversation.id;
    assert.equal((await send(ana.token, id, 'segredo')).status, 201);
    assert.equal((await t.request('GET', `/conversations/${id}/messages`, { token: carla.token })).status, 403);
    assert.equal((await t.request('GET', `/conversations/${id}/messages`, { token: bruno.token })).status, 200);
  });

  it('CA06: o histórico persiste e novos membros enxergam mensagens antigas', async () => {
    const info = await t.request('GET', `/groups/${group.id}`, { token: ana.token });
    await t.request('POST', '/groups/join', { token: carla.token, body: { code: info.data.group.inviteCode } });
    const res = await t.request('GET', `/conversations/${group.conversationId}/messages`, { token: carla.token });
    assert.equal(res.status, 200);
    assert.ok(res.data.messages.length >= 1);
    assert.equal(res.data.messages[0].text, 'Olá, pessoal!');
  });

  it('CA11: remover membro revoga o acesso ao chat do grupo', async () => {
    const del = await t.request('DELETE', `/groups/${group.id}/members/${carla.id}`, { token: ana.token });
    assert.equal(del.status, 200);
    const res = await t.request('GET', `/conversations/${group.conversationId}/messages`, { token: carla.token });
    assert.equal(res.status, 403);
  });

  it('avisa em tempo real quem foi removido e os demais membros', async () => {
    const info = await t.request('GET', `/groups/${group.id}`, { token: ana.token });
    await t.request('POST', '/groups/join', { token: carla.token, body: { code: info.data.group.inviteCode } });
    const removed = await t.socketFor(carla.token);
    const other = await t.socketFor(bruno.token);
    await new Promise((r) => setTimeout(r, 100));
    const removedNotice = new Promise((resolve) => removed.on('groups:changed', resolve));
    const membersNotice = new Promise((resolve) => other.on('group:members', resolve));

    await t.request('DELETE', `/groups/${group.id}/members/${carla.id}`, { token: ana.token });
    await removedNotice;
    assert.equal((await membersNotice).groupId, group.id);
    removed.close();
    other.close();
  });

  it('apenas o administrador remove membros', async () => {
    const res = await t.request('DELETE', `/groups/${group.id}/members/${ana.id}`, { token: bruno.token });
    assert.equal(res.status, 403);
  });

  it('CA02: entrega a mensagem em tempo real aos demais participantes', async () => {
    const socket = await t.socketFor(bruno.token);
    const received = new Promise((resolve) => socket.on('message:new', resolve));
    const sender = await t.socketFor(ana.token);
    await new Promise((r) => setTimeout(r, 100));

    const started = Date.now();
    const ack = await sender.emitWithAck('message:send', { conversationId: group.conversationId, text: 'ao vivo' });
    const message = await received;
    assert.equal(ack.ok, true);
    assert.equal(message.text, 'ao vivo');
    assert.ok(Date.now() - started < 1000);
    socket.close();
    sender.close();
  });

  it('recusa conexão de socket sem token válido', async () => {
    await assert.rejects(() => t.socketFor('invalido'));
  });
});
