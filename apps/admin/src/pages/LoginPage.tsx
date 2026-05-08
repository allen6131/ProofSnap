import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { apiRequest } from '../api/client';

export function LoginPage({ onAuth }: { onAuth: (token: string) => void }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@rampready.local');
  const [password, setPassword] = useState('admin123!');
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      const data = await apiRequest<{ access_token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      onAuth(data.access_token);
      navigate('/');
    } catch (e) {
      setError(String(e));
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '80px auto', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
      <h1>Admin Login</h1>
      <form onSubmit={submit} style={{ display: 'grid', gap: 10 }}>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" />
        <button type="submit">Login</button>
      </form>
      {error ? <p style={{ color: 'red' }}>{error}</p> : null}
    </div>
  );
}
