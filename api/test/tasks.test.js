import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer } from './helpers.js';

describe('quadro de tarefas', () => {
  let t;
  let ana;
  let bruno;
  let group;

  before(async () => {
    t = await startTestServer();
    ana = await t.createUser('Ana');
    bruno = await t.createUser('Bruno');
    group = (await t.request('POST', '/groups', { token: ana.token, body: { name: 'Equipe' } })).data.group;
  });
  after(async () => { await t.close(); });

  it('cria a tarefa na coluna "A fazer"', async () => {
    const res = await t.request('POST', `/groups/${group.id}/tasks`, {
      token: ana.token,
      body: { title: 'Escrever introdução', priority: 'high', assigneeId: ana.id, dueDate: '2026-11-13T23:59:00Z' },
    });
    assert.equal(res.status, 201);
    assert.equal(res.data.task.status, 'todo');
    assert.equal(res.data.task.priority, 'high');
    assert.equal(res.data.task.assigneeId, ana.id);
  });

  it('valida título e responsável', async () => {
    const noTitle = await t.request('POST', `/groups/${group.id}/tasks`, { token: ana.token, body: { title: ' ' } });
    const outsider = await t.request('POST', `/groups/${group.id}/tasks`, {
      token: ana.token,
      body: { title: 'x', assigneeId: bruno.id },
    });
    assert.equal(noTitle.status, 400);
    assert.equal(outsider.status, 400);
  });

  it('move a tarefa entre as colunas', async () => {
    const created = await t.request('POST', `/groups/${group.id}/tasks`, { token: ana.token, body: { title: 'Mover' } });
    const id = created.data.task.id;
    const doing = await t.request('PATCH', `/tasks/${id}`, { token: ana.token, body: { status: 'doing' } });
    assert.equal(doing.data.task.status, 'doing');
    const done = await t.request('PATCH', `/tasks/${id}`, { token: ana.token, body: { status: 'done' } });
    assert.equal(done.data.task.status, 'done');
    const invalid = await t.request('PATCH', `/tasks/${id}`, { token: ana.token, body: { status: 'outro' } });
    assert.equal(invalid.status, 400);
  });

  it('nega acesso às tarefas de quem não é membro', async () => {
    const list = await t.request('GET', `/groups/${group.id}/tasks`, { token: bruno.token });
    assert.equal(list.status, 403);
    const created = await t.request('POST', `/groups/${group.id}/tasks`, { token: ana.token, body: { title: 'Privada' } });
    const patch = await t.request('PATCH', `/tasks/${created.data.task.id}`, { token: bruno.token, body: { status: 'done' } });
    assert.equal(patch.status, 403);
  });

  it('HU07: cria a tarefa a partir de uma mensagem do chat', async () => {
    const msg = await t.request('POST', `/conversations/${group.conversationId}/messages`, {
      token: ana.token,
      body: { text: 'Precisamos revisar as referências' },
    });
    const res = await t.request('POST', `/groups/${group.id}/tasks`, {
      token: ana.token,
      body: { title: msg.data.message.text, sourceMessageId: msg.data.message.id },
    });
    assert.equal(res.status, 201);
    assert.equal(res.data.task.sourceMessageId, msg.data.message.id);
  });

  it('rejeita mensagem de origem que não pertence ao grupo', async () => {
    const other = await t.request('POST', '/groups', { token: bruno.token, body: { name: 'Outro grupo' } });
    const msg = await t.request('POST', `/conversations/${other.data.group.conversationId}/messages`, {
      token: bruno.token,
      body: { text: 'de outro grupo' },
    });
    const res = await t.request('POST', `/groups/${group.id}/tasks`, {
      token: ana.token,
      body: { title: 'x', sourceMessageId: msg.data.message.id },
    });
    assert.equal(res.status, 400);
  });

  it('lista e exclui tarefas', async () => {
    const list = await t.request('GET', `/groups/${group.id}/tasks`, { token: ana.token });
    assert.ok(list.data.tasks.length >= 3);
    const del = await t.request('DELETE', `/tasks/${list.data.tasks[0].id}`, { token: ana.token });
    assert.equal(del.status, 200);
  });
});
