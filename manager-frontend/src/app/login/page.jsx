'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaHotel, FaUserShield, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { api, setToken } from '../../lib/api';
import './Login.css';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const data = await api.login(username, password);
      setToken(data.token);
      router.push('/');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="m-login">
      <div className="m-card">
        <div className="m-brand"><FaHotel /><span>Hotel Manager Portal</span></div>
        <h1>Welcome back</h1>
        <p className="m-subtitle">Sign in to manage your rooms and reservations.</p>

        <form onSubmit={onSubmit}>
          <label className="m-field">
            <span>Username or Email</span>
            <div className="m-input">
              <FaUserShield />
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="mgr_..." required autoComplete="username" />
            </div>
          </label>

          <label className="m-field">
            <span>Password</span>
            <div className="m-input">
              <FaLock />
              <input
                type={showPwd ? 'text' : 'password'}
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" required autoComplete="current-password"
              />
              <button type="button" className="m-toggle" onClick={() => setShowPwd((s) => !s)}>
                {showPwd ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </label>

          {error && <div className="m-error">{error}</div>}

          <button type="submit" className="m-submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="m-hint">
          <strong>Test credentials</strong>
          <code>mgr_cinnamon_grand_colombo / manager123</code>
        </div>
      </div>

      <div className="m-side">
        <h2>Run your property — your way.</h2>
        <p>Track check-ins, accept walk-ins, manage rooms and watch revenue in real time.</p>
      </div>
    </div>
  );
}
