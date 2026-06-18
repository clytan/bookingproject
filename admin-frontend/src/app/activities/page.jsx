'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaPlus, FaStar, FaPencilAlt, FaTrash, FaWater } from 'react-icons/fa';
import AuthGuard from '../../components/AuthGuard.jsx';
import Sidebar from '../../components/Sidebar.jsx';
import Header from '../../components/Header.jsx';
import { api } from '../../lib/api';
import '../../styles/Dashboard.css';
import '../../styles/AdminList.css';

const CAT_LABEL = {
  snorkeling: 'Snorkeling', scuba_diving: 'Scuba Diving', surfing: 'Surfing',
  jet_ski: 'Jet Ski', kayaking: 'Kayaking', whale_watching: 'Whale Watching',
  banana_boat: 'Banana Boat', parasailing: 'Parasailing',
  catamaran_sailing: 'Catamaran Sailing', other: 'Other',
};

export default function AdminActivitiesPage() {
  return (
    <AuthGuard>
      <div className="admin-layout">
        <Sidebar />
        <div className="admin-main">
          <Header title="Water Activities" subtitle="Manage activities, slots and bookings" />
          <Inner />
        </div>
      </div>
    </AuthGuard>
  );
}

function Inner() {
  const router = useRouter();
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const load = () => {
    setLoading(true);
    api.adminActivitiesList()
      .then((res) => setItems(res.activities))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const remove = async (a) => {
    if (!confirm(`Delete "${a.name}"? This removes all slots too.`)) return;
    try { await api.adminActivityDelete(a.id); load(); }
    catch (e) { alert(e.message); }
  };

  return (
    <div className="dashboard-content">
      <div className="page-toolbar">
        <div className="page-toolbar-info">
          <strong>{items.length}</strong> activities total
        </div>
        <Link href="/activities/new" className="primary-btn"><FaPlus /> Add Activity</Link>
      </div>

      <div className="table-card">
        {loading && <div className="state">Loading activities…</div>}
        {error   && <div className="state error">{error}</div>}

        {!loading && !error && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th></th>
                  <th>Name</th>
                  <th>City</th>
                  <th>Category</th>
                  <th>Operator</th>
                  <th>Difficulty</th>
                  <th>Slots</th>
                  <th>Bookings</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((a) => (
                  <tr key={a.id} onClick={() => router.push(`/activities/${a.id}/edit`)} style={{ cursor: 'pointer' }}>
                    <td><div className="thumb" style={a.image_url ? { backgroundImage: `url(${a.image_url})` } : undefined} /></td>
                    <td className="strong">{a.name}</td>
                    <td>{a.city}</td>
                    <td><FaWater style={{ marginRight: 6, color: '#0891b2' }} />{CAT_LABEL[a.category] || a.category}</td>
                    <td className="muted">{a.operator_name || <em style={{ color: '#94a3b8' }}>unassigned</em>}</td>
                    <td className="muted">{a.difficulty}</td>
                    <td className="muted">{a.slot_count}</td>
                    <td className="muted">{a.booking_count}</td>
                    <td><span className={`status-pill ${a.is_active ? 'confirmed' : 'cancelled'}`}>{a.is_active ? 'Active' : 'Disabled'}</span></td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Link href={`/activities/${a.id}/edit`} className="icon-action" aria-label="Edit"><FaPencilAlt /></Link>
                        <button className="icon-action danger" onClick={() => remove(a)} aria-label="Delete"><FaTrash /></button>
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
