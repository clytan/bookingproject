'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FaWater } from 'react-icons/fa';
import AuthGuard from '../../../components/AuthGuard.jsx';
import Sidebar from '../../../components/Sidebar.jsx';
import Header from '../../../components/Header.jsx';
import OperatorForm from '../../../components/OperatorForm.jsx';
import { api } from '../../../lib/api';
import '../../../styles/Dashboard.css';
import '../../../styles/AdminList.css';
import '../../../styles/HotelForm.css';

function EditOperatorInner() {
  const params = useSearchParams();
  const id     = params.get('id');
  const [operator, setOperator] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    if (!id) return;
    api.adminOperatorGet(id)
      .then((res) => { setOperator(res.operator); setActivities(res.activities); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <AuthGuard>
      <div className="admin-layout">
        <Sidebar />
        <div className="admin-main">
          <Header title="Edit Operator" subtitle="Update credentials and review owned activities" />
          <div className="dashboard-content">
            {loading && <div className="state">Loading…</div>}
            {error   && <div className="state error">{error}</div>}
            {!loading && !error && operator && (
              <>
                <OperatorForm initial={operator} title={`Editing: ${operator.full_name}`} />
                <div className="table-card" style={{ marginTop: 24 }}>
                  <div style={{ padding: '18px 22px', borderBottom: '1px solid #e5e7eb' }}>
                    <h3 style={{ margin: 0, fontSize: 16 }}><FaWater style={{ marginRight: 8, color: '#0891b2' }} />Activities owned ({activities.length})</h3>
                    <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>This operator can log in and manage these. Use the activity edit pages to reassign.</p>
                  </div>
                  {activities.length === 0 ? (
                    <div className="state">No activities assigned to this operator yet.</div>
                  ) : (
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr><th>Name</th><th>City</th><th>Category</th><th>Status</th><th></th></tr>
                        </thead>
                        <tbody>
                          {activities.map((a) => (
                            <tr key={a.id}>
                              <td className="strong">{a.name}</td>
                              <td>{a.city}</td>
                              <td className="muted">{a.category}</td>
                              <td><span className={`status-pill ${a.is_active ? 'confirmed' : 'cancelled'}`}>{a.is_active ? 'Active' : 'Disabled'}</span></td>
                              <td><Link href={`/activities/edit?id=${a.id}`} className="icon-action">Manage</Link></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}

export default function EditOperatorPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40 }}>Loading…</div>}>
      <EditOperatorInner />
    </Suspense>
  );
}
