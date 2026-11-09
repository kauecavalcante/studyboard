import { useState } from 'react';
import { api } from '../api.js';

export default function Members({ group, me, onChanged, onOpenDirect }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const isAdmin = group.role === 'admin';

  async function run(action, success) {
    setError('');
    setMessage('');
    try {
      await action();
      if (success) setMessage(success);
      await onChanged();
    } catch (err) {
      setError(err.message);
    }
  }

  const invite = (e) => {
    e.preventDefault();
    run(async () => {
      await api('POST', `/groups/${group.id}/members`, { email });
      setEmail('');
    }, 'Membro adicionado.');
  };

  const remove = (member) => {
    if (!window.confirm(`Remover ${member.name} do grupo?`)) return;
    run(() => api('DELETE', `/groups/${group.id}/members/${member.userId}`), 'Membro removido.');
  };

  const openDirect = async (member) => {
    setError('');
    try {
      const data = await api('POST', '/conversations/direct', { userId: member.userId });
      await onOpenDirect(data.conversation);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="members">
      {isAdmin && (
        <div className="card">
          <h3>Convidar</h3>
          <p className="muted">
            Código de convite: <code className="code">{group.inviteCode}</code>
            <button className="link tiny" onClick={() => navigator.clipboard?.writeText(group.inviteCode)}>Copiar</button>
          </p>
          <form className="inline-form row" onSubmit={invite}>
            <input
              type="email"
              placeholder="E-mail de um usuário cadastrado"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button className="primary small">Adicionar</button>
          </form>
        </div>
      )}
      {message && <p className="success">{message}</p>}
      {error && <p className="error" role="alert">{error}</p>}

      <ul className="member-list">
        {group.members.map((m) => (
          <li key={m.userId} className="card">
            <div>
              <strong>{m.name}</strong> {m.role === 'admin' && <span className="tag">Admin</span>}
              <div className="muted">{m.email}</div>
            </div>
            <div>
              {m.userId !== me.id && <button className="link" onClick={() => openDirect(m)}>Conversar</button>}
              {isAdmin && m.role !== 'admin' && <button className="link danger" onClick={() => remove(m)}>Remover</button>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
