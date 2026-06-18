'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import OtpForm from '../../components/OtpForm';
import '../../styles/AuthPages.css';

function RegisterInner() {
  const params = useSearchParams();
  const redirect = params.get('redirect') || '/';

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link href="/" className="auth-brand">
          <img src="/cokalo-logo.jpg" alt="COKALO" />
        </Link>

        <h1>Create your account</h1>
        <p className="auth-subtitle">
          Sign up with your email. We&apos;ll send a 6-digit code to confirm it&apos;s really you.
        </p>

        <OtpForm mode="signup" />

        <p className="auth-footer">
          Already have an account?{' '}
          <Link href={`/login${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}>
            Sign in
          </Link>
        </p>
      </div>

      <div className="auth-side">
        <span className="auth-eyebrow">Explore · Discover · Celebrate</span>
        <h2>Your <em>adventure</em> starts here.</h2>
        <p>Join travellers who book hotels and water-sport experiences with COKALO every day.</p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40 }}>Loading…</div>}>
      <RegisterInner />
    </Suspense>
  );
}
