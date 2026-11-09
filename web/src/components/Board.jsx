import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { getSocket } from '../socket.js';

const COLUMNS = [
  { id: 'todo', label: 'A fazer' },
  { id: 'doing', label: 'Em andamento' },
  { id: 'done', label: 'Concluído' },
];
const PRIORITIES = { high: 'Alta', medium: 'Média', low: 'Baixa' };

const emptyForm = { title: '', description: '', assigneeId: '', dueDate: '', priority: 'medium' };

function isOverdue(task) {
  return task.status !== 'done' && task.dueDate && new Date(task.dueDate) < new Date();
}

export default function Board({ group, draft, onDraftUsed }) {
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [sourceMessageId, setSourceMessageId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await api('GET', `/groups/${group.id}/tasks`);
      setTasks(data.tasks);
    } catch (err) {
      setError(err.message);
    }
  }, [group.id]);

  useEffect(() => {
    load();
    const socket = getSocket();
    const handler = (event) => event.groupId === group.id && load();
    socket?.on('task:changed', handler);
    return () => socket?.off('task:changed', handler);
  }, [group.id, load]);

  useEffect(() => {
    if (!draft) return;
    setForm({ ...emptyForm, title: draft.text.slice(0, 140) });
    setSourceMessageId(draft.id);
    setFormOpen(true);
    onDraftUsed();
  }, [draft, onDraftUsed]);

  const nameOf = (id) => group.members.find((m) => m.userId === id)?.name;

  async function create(e) {
    e.preventDefault();
    setError('');
    try {
      await api('POST', `/groups/${group.id}/tasks`, {
        ...form,
        assigneeId: form.assigneeId || null,
        dueDate: form.dueDate ? new Date(`${form.dueDate}T23:59:00`).toISOString() : null,
        sourceMessageId,
      });
      setForm(emptyForm);
      setSourceMessageId(null);
      setFormOpen(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function move(task, status) {
    if (task.status === status) return;
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status } : t)));
    try {
      await api('PATCH', `/tasks/${task.id}`, { status });
    } catch (err) {
      setError(err.message);
      load();
    }
  }

  async function remove(task) {
    if (!window.confirm(`Excluir a tarefa "${task.title}"?`)) return;
    try {
      await api('DELETE', `/tasks/${task.id}`);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  function onDrop(e, status) {
    e.preventDefault();
    const task = tasks.find((t) => t.id === e.dataTransfer.getData('text/plain'));
    if (task) move(task, status);
  }

  const field = (name) => (e) => setForm({ ...form, [name]: e.target.value });

  return (
    <div className="board">
      <div className="board-toolbar">
        <button className="primary" onClick={() => setFormOpen(!formOpen)}>
          {formOpen ? 'Cancelar' : 'Nova tarefa'}
        </button>
        {error && <span className="error">{error}</span>}
      </div>

      {formOpen && (
        <form className="card task-form" onSubmit={create}>
          <label>
            Título
            <input value={form.title} onChange={field('title')} maxLength={140} required autoFocus />
          </label>
          <label>
            Descrição
            <textarea rows={2} value={form.description} onChange={field('description')} />
          </label>
          <div className="row">
            <label>
              Responsável
              <select value={form.assigneeId} onChange={field('assigneeId')}>
                <option value="">Sem responsável</option>
                {group.members.map((m) => (
                  <option key={m.userId} value={m.userId}>{m.name}</option>
                ))}
              </select>
            </label>
            <label>
              Prazo
              <input type="date" value={form.dueDate} onChange={field('dueDate')} />
            </label>
            <label>
              Prioridade
              <select value={form.priority} onChange={field('priority')}>
                {Object.entries(PRIORITIES).map(([id, label]) => (
                  <option key={id} value={id}>{label}</option>
                ))}
              </select>
            </label>
          </div>
          {sourceMessageId && <p className="muted">Esta tarefa será vinculada a uma mensagem do chat.</p>}
          <button className="primary">Salvar tarefa</button>
        </form>
      )}

      <div className="columns">
        {COLUMNS.map((column) => {
          const items = tasks.filter((t) => t.status === column.id);
          return (
            <section
              key={column.id}
              className="column"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onDrop(e, column.id)}
            >
              <h3>{column.label} <span className="count">{items.length}</span></h3>
              {items.map((task) => (
                <article
                  key={task.id}
                  className={`task priority-${task.priority} ${isOverdue(task) ? 'overdue' : ''}`}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('text/plain', task.id)}
                >
                  <strong>{task.title}</strong>
                  {task.description && <p>{task.description}</p>}
                  <div className="tags">
                    <span className="tag">{PRIORITIES[task.priority]}</span>
                    {task.assigneeId && <span className="tag">{nameOf(task.assigneeId) ?? 'Ex-membro'}</span>}
                    {task.dueDate && (
                      <span className="tag">
                        {isOverdue(task) ? 'Atrasada · ' : ''}
                        {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                  <div className="task-actions">
                    <select
                      aria-label="Mover tarefa"
                      value={task.status}
                      onChange={(e) => move(task, e.target.value)}
                    >
                      {COLUMNS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                    <button className="link tiny" onClick={() => remove(task)}>Excluir</button>
                  </div>
                </article>
              ))}
              {items.length === 0 && <p className="muted center">Sem tarefas</p>}
            </section>
          );
        })}
      </div>
    </div>
  );
}
