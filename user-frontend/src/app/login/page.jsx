'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaShieldAlt, FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../../lib/AuthContext';
import OtpForm from '../../components/OtpForm';
import '../../styles/AuthPages.css';

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get('redirect') || '/';
  const { login } = useAuth();

  const [tab, setTab] = useState('otp');           // 'otp' | 'email'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onEmailLogin = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(email, password);
      router.push(redirect);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link href="/" className="auth-brand">
          <img src="/cokalo-logo.jpg" alt="COKALO" />
        </Link>

        <h1>Welcome back</h1>
        <p className="auth-subtitle">Sign in to view your bookings and complete checkout.</p>

        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${tab === 'otp' ? 'active' : ''}`}
            onClick={() => setTab('otp')}
          >
            <FaShieldAlt /> Email OTP
          </button>
          <button
            type="button"
            className={`auth-tab ${tab === 'email' ? 'active' : ''}`}
            onClick={() => setTab('email')}
          >
            <FaLock /> Password
          </button>
        </div>

        {tab === 'otp' ? (
          <OtpForm mode="login" />
        ) : (
          <form onSubmit={onEmailLogin} className="auth-form">
            <label className="field">
              <span>Email</span>
              <div className="input-wrap">
                <FaEnvelope />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                       placeholder="you@example.com" autoComplete="email" required />
              </div>
            </label>
            <label className="field">
              <span>Password</span>
              <div className="input-wrap">
                <FaLock />
                <input type={showPwd ? 'text' : 'password'} value={password}
                       onChange={(e) => setPassword(e.target.value)}
                       placeholder="••••••••" autoComplete="current-password" required />
                <button type="button" className="toggle-pwd" onClick={() => setShowPwd((s) => !s)}>
                  {showPwd ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </label>
            {error && <div className="auth-error">{error}</div>}
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        )}

        <p className="auth-footer">
          Don&apos;t have an account?{' '}
          <Link href={`/register${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}>
            Create one
          </Link>
        </p>
      </div>

      <div className="auth-side">
        <span className="auth-eyebrow">Explore · Discover · Celebrate</span>
        <h2>Your trip <em>starts</em> here.</h2>
        <p>Hotels and water-sport experiences — booked together, in seconds.</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40 }}>Loading…</div>}>
      <LoginInner />
    </Suspense>
  );
}
