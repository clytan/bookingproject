'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getToken, clearToken } from '../lib/api';

const OperatorContext = createContext(null);

export function useOperator() {
  return useContext(OperatorContext);
}

export default function AuthGuard({ children }) {
  const router = useRouter();
  const [operator, setOperator] = useState(null);
  const [status, setStatus]     = useState('checking');

  useEffect(() => {
    if (!getToken()) { router.replace('/login'); return; }
    api.me()
      .then((res) => { setOperator(res.operator); setStatus('ok'); })
      .catch(() => { clearToken(); router.replace('/login'); });
  }, [router]);

  if (status !== 'ok') {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', color:'#64748b', fontSize:14 }}>
        Checking session…
      </div>
    );
  }
  return <OperatorContext.Provider value={operator}>{children}</OperatorContext.Provider>;
}
