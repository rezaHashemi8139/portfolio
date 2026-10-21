'use client';

import { useState, type FormEvent } from 'react';
import { api, json } from './api';

export function LoginForm() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await api('/api/admin/login', json('POST', { password }));
    if (res.ok) {
      window.location.href = '/admin';
      return;
    }
    setBusy(false);
    setError(res.message);
  };

  return (
    <form className="login__form" onSubmit={(e) => void submit(e)}>
      <label htmlFor="pw">Password</label>
      <input id="pw" type="password" autoComplete="current-password" autoFocus required value={password} onChange={(e) => setPassword(e.target.value)} />
      {error ? (
        <p className="field__error" role="alert">
          {error}
        </p>
      ) : null}
      <button type="submit" className="btn btn--primary" disabled={busy || !password}>
        {busy ? 'Checking…' : 'Sign in'}
      </button>
    </form>
  );
}
