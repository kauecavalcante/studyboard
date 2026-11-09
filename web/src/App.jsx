import { useCallback, useEffect, useState } from 'react';
import { api, session, setUnauthorizedHandler } from './api.js';
import { connectSocket, disconnectSocket } from './socket.js';
import AuthForm from './components/AuthForm.jsx';
import Sidebar from './components/Sidebar.jsx';
import GroupView from './components/GroupView.jsx';
import Chat from './components/Chat.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(Boolean(session.token));
  const [groups, setGroups] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const logout = useCallback(() => {
    session.token = null;
    disconnectSocket();
    setUser(null);
    setGroups([]);
    setConversations([]);
    setSelected(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
  }, [logout]);

  const refresh = useCallback(async () => {
    const [g, c] = await Promise.all([api('GET', '/groups'), api('GET', '/conversations')]);
    setGroups(g.groups);
    setConversations(c.conversations);
    return g.groups;
  }, []);

  useEffect(() => {
    if (!session.token) return;
    api('GET', '/auth/me')
      .then((data) => {
        setUser(data.user);
        connectSocket(session.token);
      })
      .catch(logout)
      .finally(() => setBooting(false));
  }, [logout]);

  useEffect(() => {
    if (!user) return;
    refresh().then((list) => {
      setSelected((current) => current ?? (list[0] ? { type: 'group', groupId: list[0].id } : null));
    });
  }, [user, refresh]);

  function authenticated(token, profile) {
    session.token = token;
    connectSocket(token);
    setUser(profile);
  }

  async function openDirect(conversation) {
    await refresh();
    setSelected({ type: 'direct', conversationId: conversation.id });
  }

  if (booting) return <p className="muted pad">Carregando...</p>;
  if (!user) return <AuthForm onAuthenticated={authenticated} />;

  const directs = conversations.filter((c) => c.type === 'direct');
  const activeDirect = selected?.type === 'direct' && directs.find((c) => c.id === selected.conversationId);

  const select = (next) => {
    setSelected(next);
    setMenuOpen(false);
  };

  return (
    <div className="layout">
      <Sidebar
        user={user}
        groups={groups}
        directs={directs}
        selected={selected}
        onSelect={select}
        onChanged={refresh}
        onLogout={logout}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      />
      <main className="content">
        <button className="icon menu-button mobile-only" onClick={() => setMenuOpen(true)} aria-label="Abrir menu">☰</button>
        {selected?.type === 'group' && (
          <GroupView
            key={selected.groupId}
            groupId={selected.groupId}
            me={user}
            onOpenDirect={openDirect}
            onGroupsChanged={refresh}
          />
        )}
        {activeDirect && (
          <div className="group-view">
            <header className="group-header"><h2>{activeDirect.title}</h2></header>
            <div className="group-body">
              <Chat key={activeDirect.id} conversationId={activeDirect.id} me={user} />
            </div>
          </div>
        )}
        {!selected && (
          <div className="empty">
            <h2>Bem-vindo ao StudyBoard</h2>
            <p className="muted">Crie um grupo ou entre com um código de convite para começar.</p>
          </div>
        )}
      </main>
    </div>
  );
}
