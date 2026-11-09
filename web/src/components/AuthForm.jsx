import { useState } from 'react';
import { api } from '../api.js';

export default function AuthForm({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const path = mode === 'login' ? '/auth/login' : '/auth/register';
      const payload = mode === 'login' ? { email: form.email, password: form.password } : form;
      const data = await api('POST', path, payload);
      onAuthenticated(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth">
      <form className="card auth-card" onSubmit={submit}>
        <h1>StudyBoard</h1>
        <p className="muted">Chat e tarefas para o seu grupo de estudo.</p>

        {mode === 'register' && (
          <label>
            Nome
            <input value={form.name} onChange={update('name')} autoComplete="name" required />
          </label>
        )}
        <label>
          E-mail
          <input type="email" value={form.email} onChange={update('email')} autoComplete="email" required />
        </label>
        <label>
          Senha
          <input
            type="password"
            value={form.password}
            onChange={update('password')}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            minLength={6}
            required
          />
        </label>

        {error && <p className="error" role="alert">{error}</p>}
        <button className="primary" disabled={busy}>
          {mode === 'login' ? 'Entrar' : 'Criar conta'}
        </button>
        <button
          type="button"
          className="link"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login');
            setError('');
          }}
        >
          {mode === 'login' ? 'Ainda não tenho conta' : 'Já tenho conta'}
        </button>
      </form>
    </main>
  );
}
