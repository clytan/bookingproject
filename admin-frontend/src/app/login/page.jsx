'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaBus, FaUserShield, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { api, setToken } from '../../lib/api';
import '../../styles/Login.css';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.adminLogin(username, password);
      setToken(data.token);
      router.push('/');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <FaBus />
          <span>COKALO Admin</span>
        </div>

        <h1>Welcome back</h1>
        <p className="subtitle">Sign in to manage buses, routes and bookings.</p>

        <form onSubmit={handleSubmit} className="login-form">
          <label className="field">
            <span>Username or Email</span>
            <div className="input-wrap">
              <FaUserShield />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                autoComplete="username"
                required
              />
            </div>
          </label>

          <label className="field">
            <span>Password</span>
            <div className="input-wrap">
              <FaLock />
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="toggle-pwd"
                onClick={() => setShowPwd((s) => !s)}
                aria-label={showPwd ? 'Hide password' : 'Show password'}
              >
                {showPwd ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </label>

          {error && <div className="error-banner">{error}</div>}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="login-hint">
          <strong>Default credentials</strong> (after running seed):
          <code>admin / admin123</code>
        </div>
      </div>

      <div className="login-side">
        <h2>Manage your fleet, your way.</h2>
        <p>Track bookings, control schedules and run reports — all in one dashboard.</p>
      </div>
    </div>
  );
}
