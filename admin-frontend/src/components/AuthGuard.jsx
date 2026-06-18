'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, clearToken } from '../lib/api';

export default function AuthGuard({ children }) {
  const router = useRouter();
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    let mounted = true;
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
    if (!token) {
      router.replace('/login');
      return;
    }
    api.adminMe()
      .then(() => mounted && setStatus('ok'))
      .catch(() => {
        clearToken();
        router.replace('/login');
      });
    return () => { mounted = false; };
  }, [router]);

  if (status !== 'ok') {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', color: '#6b7280', fontSize: 14,
      }}>
        Checking session…
      </div>
    );
  }
  return children;
}
