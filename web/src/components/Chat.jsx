import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import { getSocket } from '../socket.js';

const formatTime = (iso) =>
  new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

export default function Chat({ conversationId, me, onCreateTask }) {
  const [messages, setMessages] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const listRef = useRef(null);
  const stickToBottom = useRef(true);

  useEffect(() => {
    let cancelled = false;
    setMessages([]);
    setCursor(null);
    setLoading(true);
    setError('');
    stickToBottom.current = true;
    api('GET', `/conversations/${conversationId}/messages`)
      .then((data) => {
        if (cancelled) return;
        setMessages(data.messages);
        setCursor(data.nextCursor);
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return undefined;
    const handler = (message) => {
      if (message.conversationId !== conversationId) return;
      const list = listRef.current;
      stickToBottom.current = !list || list.scrollHeight - list.scrollTop - list.clientHeight < 80;
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
    };
    socket.on('message:new', handler);
    return () => socket.off('message:new', handler);
  }, [conversationId]);

  useEffect(() => {
    const list = listRef.current;
    if (list && stickToBottom.current) list.scrollTop = list.scrollHeight;
  }, [messages]);

  const loadOlder = useCallback(async () => {
    if (!cursor) return;
    const list = listRef.current;
    const previousHeight = list.scrollHeight;
    try {
      const data = await api('GET', `/conversations/${conversationId}/messages?before=${cursor}`);
      stickToBottom.current = false;
      setMessages((prev) => [...data.messages, ...prev]);
      setCursor(data.nextCursor);
      requestAnimationFrame(() => {
        list.scrollTop = list.scrollHeight - previousHeight;
      });
    } catch (err) {
      setError(err.message);
    }
  }, [conversationId, cursor]);

  async function submit(e) {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    setError('');
    stickToBottom.current = true;
    const socket = getSocket();
    const result = await socket.emitWithAck('message:send', { conversationId, text: content });
    if (result.ok) setText('');
    else setError(result.error);
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) submit(e);
  }

  return (
    <div className="chat">
      <div className="messages" ref={listRef}>
        {cursor && (
          <button className="link center" onClick={loadOlder}>Carregar mensagens anteriores</button>
        )}
        {loading && <p className="muted center">Carregando...</p>}
        {!loading && messages.length === 0 && <p className="muted center">Nenhuma mensagem ainda. Diga olá!</p>}
        {messages.map((m) => {
          const mine = m.senderId === me.id;
          return (
            <div key={m.id} className={`message ${mine ? 'mine' : ''}`}>
              <div className="meta">
                <strong>{mine ? 'Você' : m.senderName}</strong>
                <time dateTime={m.createdAt}>{formatTime(m.createdAt)}</time>
              </div>
              <p>{m.text}</p>
              {onCreateTask && (
                <button className="link tiny" onClick={() => onCreateTask(m)}>Criar tarefa</button>
              )}
            </div>
          );
        })}
      </div>
      {error && <p className="error pad" role="alert">{error}</p>}
      <form className="composer" onSubmit={submit}>
        <textarea
          rows={1}
          value={text}
          maxLength={2000}
          placeholder="Escreva uma mensagem"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <button className="primary" disabled={!text.trim()}>Enviar</button>
      </form>
    </div>
  );
}
