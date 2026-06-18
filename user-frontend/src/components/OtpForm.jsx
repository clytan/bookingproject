'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaEnvelope, FaArrowLeft, FaShieldAlt, FaUser, FaPhone, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { api } from '../lib/api';
import { useAuth } from '../lib/AuthContext';

/**
 * mode: 'login' | 'signup'
 *
 * Steps:
 *   1) email  — enter email + send OTP
 *   2) code   — enter the 6-digit code (and, if signup, name + optional phone)
 *   3) done   — token+user installed, redirect
 */
export default function OtpForm({ mode = 'login' }) {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params?.get('redirect') || '/';
  const { adoptSession } = useAuth();
  const isSignup = mode === 'signup';

  const [step, setStep]       = useState('email');
  const [email, setEmail]     = useState('');
  const [name, setName]       = useState('');
  const [phone, setPhone]     = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [code, setCode]       = useState('');
  const [devCode, setDevCode] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const codeRef = useRef(null);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  useEffect(() => {
    if (step === 'code' && codeRef.current) codeRef.current.focus();
  }, [step]);

  const sendOtp = async (e) => {
    e?.preventDefault();
    setError('');
    if (!email.trim()) { setError('Enter your email'); return; }
    setLoading(true);
    try {
      const res = await api.otpRequest(email.trim(), mode);
      setEmail(res.email);
      setDevCode(res.dev_code || '');
      setResendIn(60);
      setStep('code');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (resendIn > 0 || loading) return;
    setError('');
    setLoading(true);
    try {
      const res = await api.otpRequest(email, mode);
      setDevCode(res.dev_code || '');
      setResendIn(60);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verify = async (e) => {
    e?.preventDefault();
    setError('');
    if (code.length !== 6) { setError('Enter the 6-digit code'); return; }
    if (isSignup) {
      if (!name.trim()) { setError('Please enter your name'); return; }
      if (password && password.length < 6) {
        setError('Password must be at least 6 characters (or leave it blank).');
        return;
      }
    }
    setLoading(true);
    try {
      const payload = { email, code, purpose: mode };
      if (isSignup) {
        payload.name = name.trim();
        if (phone.trim())    payload.phone    = phone.trim();
        if (password.trim()) payload.password = password;
      }
      const res = await api.otpVerify(payload);
      adoptSession(res);
      router.push(redirect);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'email') {
    return (
      <form className="auth-form" onSubmit={sendOtp}>
        <label className="field">
          <span>Email</span>
          <div className="input-wrap">
            <FaEnvelope />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              autoFocus
              required
            />
          </div>
          <small className="field-hint">We&apos;ll email you a 6-digit code. No password needed.</small>
        </label>

        {error && <div className="auth-error">{error}</div>}

        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? 'Sending…' : 'Send code'}
        </button>
      </form>
    );
  }

  return (
    <form className="auth-form" onSubmit={verify}>
      <button type="button" className="auth-back" onClick={() => { setStep('email'); setCode(''); setError(''); }}>
        <FaArrowLeft /> Change email
      </button>

      <div className="auth-sent-to">
        <FaEnvelope className="auth-sent-icon" />
        <div>
          <div className="auth-sent-line">Code sent to <strong>{email}</strong></div>
          <div className="auth-sent-sub">Check your inbox (and spam folder). The code expires in 5 minutes.</div>
        </div>
      </div>

      {devCode && (
        <div className="auth-dev">
          <strong>DEV mode:</strong> your code is <code>{devCode}</code>
          <button type="button" onClick={() => setCode(devCode)} className="auth-dev-fill">Autofill</button>
        </div>
      )}

      <label className="field">
        <span>6-digit code</span>
        <div className="input-wrap">
          <FaShieldAlt />
          <input
            ref={codeRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="••••••"
            className="auth-otp-input"
            required
          />
        </div>
      </label>

      {isSignup && (
        <>
          <label className="field">
            <span>Your name</span>
            <div className="input-wrap">
              <FaUser />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                autoComplete="name"
                required
              />
            </div>
          </label>
          <label className="field">
            <span>Phone (optional)</span>
            <div className="input-wrap">
              <FaPhone />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                autoComplete="tel"
              />
            </div>
          </label>
          <label className="field">
            <span>Set a password (optional)</span>
            <div className="input-wrap">
              <FaLock />
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Skip to keep your login OTP-only"
                autoComplete="new-password"
              />
              <button type="button" className="toggle-pwd" onClick={() => setShowPwd((s) => !s)}>
                {showPwd ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            <small className="field-hint">If you set one, you&apos;ll be able to log in with email + password too.</small>
          </label>
        </>
      )}

      {error && <div className="auth-error">{error}</div>}

      <button type="submit" className="auth-submit" disabled={loading}>
        {loading ? 'Verifying…' : (isSignup ? 'Create account' : 'Log in')}
      </button>

      <div className="auth-resend">
        Didn&apos;t receive the email?{' '}
        {resendIn > 0
          ? <span className="auth-resend-wait">Resend in {resendIn}s</span>
          : <button type="button" onClick={resend} disabled={loading} className="auth-resend-btn">Resend</button>
        }
      </div>
    </form>
  );
}
