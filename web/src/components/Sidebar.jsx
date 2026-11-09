import { useState } from 'react';
import { api } from '../api.js';

export default function Sidebar({ user, groups, directs, selected, onSelect, onChanged, onLogout, open, onClose }) {
  const [panel, setPanel] = useState(null);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  function toggle(next) {
    setPanel(panel === next ? null : next);
    setValue('');
    setError('');
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    try {
      const data =
        panel === 'create'
          ? await api('POST', '/groups', { name: value })
          : await api('POST', '/groups/join', { code: value });
      await onChanged();
      onSelect({ type: 'group', groupId: data.group.id });
      setPanel(null);
      setValue('');
    } catch (err) {
      setError(err.message);
    }
  }

  const isGroupActive = (g) => selected?.type === 'group' && selected.groupId === g.id;
  const isDirectActive = (c) => selected?.type === 'direct' && selected.conversationId === c.id;

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <header>
        <strong>StudyBoard</strong>
        <button className="icon mobile-only" onClick={onClose} aria-label="Fechar menu">✕</button>
      </header>

      <section>
        <div className="section-title">
          <span>Grupos</span>
          <span>
            <button className="icon" title="Entrar com código" onClick={() => toggle('join')}>🔑</button>
            <button className="icon" title="Novo grupo" onClick={() => toggle('create')}>＋</button>
          </span>
        </div>
        {panel && (
          <form className="inline-form" onSubmit={submit}>
            <input
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={panel === 'create' ? 'Nome do grupo' : 'Código de convite'}
              required
            />
            <button className="primary small">{panel === 'create' ? 'Criar' : 'Entrar'}</button>
            {error && <p className="error">{error}</p>}
          </form>
        )}
        <ul>
          {groups.map((g) => (
            <li key={g.id}>
              <button className={isGroupActive(g) ? 'active' : ''} onClick={() => onSelect({ type: 'group', groupId: g.id })}>
                # {g.name}
              </button>
            </li>
          ))}
          {groups.length === 0 && <li className="muted pad">Crie um grupo ou entre com um código.</li>}
        </ul>
      </section>

      <section>
        <div className="section-title"><span>Conversas diretas</span></div>
        <ul>
          {directs.map((c) => (
            <li key={c.id}>
              <button className={isDirectActive(c) ? 'active' : ''} onClick={() => onSelect({ type: 'direct', conversationId: c.id })}>
                {c.title}
              </button>
            </li>
          ))}
          {directs.length === 0 && <li className="muted pad">Inicie uma conversa pela aba Membros.</li>}
        </ul>
      </section>

      <footer>
        <span title={user.email}>{user.name}</span>
        <button className="link" onClick={onLogout}>Sair</button>
      </footer>
    </aside>
  );
}
