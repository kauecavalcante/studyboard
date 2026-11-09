import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import Chat from './Chat.jsx';
import Board from './Board.jsx';
import Members from './Members.jsx';

export default function GroupView({ groupId, me, onOpenDirect, onGroupsChanged }) {
  const [group, setGroup] = useState(null);
  const [tab, setTab] = useState('chat');
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await api('GET', `/groups/${groupId}`);
      setGroup(data.group);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, [groupId]);

  useEffect(() => {
    setGroup(null);
    setTab('chat');
    load();
  }, [load]);

  const changed = async () => {
    await load();
    await onGroupsChanged();
  };

  const createTaskFrom = (message) => {
    setDraft(message);
    setTab('tasks');
  };

  const clearDraft = useCallback(() => setDraft(null), []);

  if (error) return <p className="error pad">{error}</p>;
  if (!group) return <p className="muted pad">Carregando...</p>;

  return (
    <div className="group-view">
      <header className="group-header">
        <div>
          <h2>{group.name}</h2>
          {group.description && <p className="muted">{group.description}</p>}
        </div>
        <nav className="tabs">
          {[
            ['chat', 'Chat'],
            ['tasks', 'Tarefas'],
            ['members', `Membros (${group.memberCount})`],
          ].map(([id, label]) => (
            <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{label}</button>
          ))}
        </nav>
      </header>

      <div className="group-body">
        {tab === 'chat' && <Chat conversationId={group.conversationId} me={me} onCreateTask={createTaskFrom} />}
        {tab === 'tasks' && <Board group={group} draft={draft} onDraftUsed={clearDraft} />}
        {tab === 'members' && <Members group={group} me={me} onChanged={changed} onOpenDirect={onOpenDirect} />}
      </div>
    </div>
  );
}
