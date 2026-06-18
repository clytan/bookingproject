'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getToken, clearToken } from '../lib/api';

const ManagerContext = createContext(null);

export function useManager() {
  return useContext(ManagerContext);
}

export default function AuthGuard({ children }) {
  const router = useRouter();
  const [manager, setManager] = useState(null);
  const [status, setStatus]   = useState('checking');

  useEffect(() => {
    if (!getToken()) { router.replace('/login'); return; }
    api.me()
      .then((res) => { setManager(res.manager); setStatus('ok'); })
      .catch(() => { clearToken(); router.replace('/login'); });
  }, [router]);

  if (status !== 'ok') {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', color:'#64748b', fontSize:14 }}>
        Checking session…
      </div>
    );
  }
  return <ManagerContext.Provider value={manager}>{children}</ManagerContext.Provider>;
}
