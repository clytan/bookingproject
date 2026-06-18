'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaPlus, FaPencilAlt, FaTrash } from 'react-icons/fa';
import AuthGuard from '../../components/AuthGuard.jsx';
import Sidebar from '../../components/Sidebar.jsx';
import Header from '../../components/Header.jsx';
import { api } from '../../lib/api';
import '../../styles/Dashboard.css';
import '../../styles/AdminList.css';

export default function OperatorsPage() {
  return (
    <AuthGuard>
      <div className="admin-layout">
        <Sidebar />
        <div className="admin-main">
          <Header title="Operators" subtitle="Water sports companies who run activities on COKALO" />
          <Inner />
        </div>
      </div>
    </AuthGuard>
  );
}

function Inner() {
  const router = useRouter();
  const [operators, setOperators] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  const load = () => {
    setLoading(true);
    api.adminOperatorsList()
      .then((res) => setOperators(res.operators))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const remove = async (o) => {
    if (!confirm(`Delete operator "${o.username}"? They must own zero activities first.`)) return;
    try { await api.adminOperatorDelete(o.id); load(); }
    catch (e) { alert(e.message); }
  };

  return (
    <div className="dashboard-content">
      <div className="page-toolbar">
        <div className="page-toolbar-info">
          <strong>{operators.length}</strong> operators
        </div>
        <Link href="/operators/new" className="primary-btn"><FaPlus /> Add Operator</Link>
      </div>

      <div className="table-card">
        {loading && <div className="state">Loading operators…</div>}
        {error   && <div className="state error">{error}</div>}
        {!loading && !error && operators.length === 0 && <div className="state">No operators yet.</div>}

        {!loading && !error && operators.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Company / Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Activities</th>
                  <th>Bookings</th>
                  <th>Comm %</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {operators.map((o) => (
                  <tr key={o.id} onClick={() => router.push(`/operators/edit?id=${o.id}`)} style={{ cursor: 'pointer' }}>
                    <td className="mono">{o.username}</td>
                    <td className="strong">{o.full_name}</td>
                    <td className="muted">{o.email}</td>
                    <td className="muted">{o.phone || '—'}</td>
                    <td className="muted">{o.activity_count}</td>
                    <td className="muted">{o.booking_count}</td>
                    <td className="strong">{Number(o.commission_percent || 0).toFixed(o.commission_percent % 1 === 0 ? 0 : 1)}%</td>
                    <td><span className={`status-pill ${o.is_active ? 'confirmed' : 'cancelled'}`}>{o.is_active ? 'Active' : 'Disabled'}</span></td>
                    <td className="muted small">{o.created_at?.slice(0,10)}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Link href={`/operators/edit?id=${o.id}`} className="icon-action" aria-label="Edit"><FaPencilAlt /></Link>
                        <button className="icon-action danger" onClick={() => remove(o)} aria-label="Delete"><FaTrash /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
