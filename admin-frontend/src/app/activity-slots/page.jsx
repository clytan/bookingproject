'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaClock, FaUsers, FaPencilAlt } from 'react-icons/fa';
import AuthGuard from '../../components/AuthGuard.jsx';
import Sidebar from '../../components/Sidebar.jsx';
import Header from '../../components/Header.jsx';
import { api } from '../../lib/api';
import '../../styles/Dashboard.css';
import '../../styles/AdminList.css';

export default function ActivitySlotsPage() {
  return (
    <AuthGuard>
      <div className="admin-layout">
        <Sidebar />
        <div className="admin-main">
          <Header title="Activity Slots" subtitle="All slots across every water activity" />
          <Inner />
        </div>
      </div>
    </AuthGuard>
  );
}

function Inner() {
  const router = useRouter();
  const [slots, setSlots]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [filter, setFilter]   = useState(0);

  useEffect(() => {
    setLoading(true);
    api.adminSlotsList()
      .then((res) => setSlots(res.slots))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const activities = useMemo(() => {
    const m = new Map();
    slots.forEach((s) => { if (!m.has(s.activity_id)) m.set(s.activity_id, s.activity_name); });
    return Array.from(m, ([id, name]) => ({ id, name }));
  }, [slots]);

  const filtered = filter ? slots.filter((s) => s.activity_id === filter) : slots;

  return (
    <div className="dashboard-content">
      <div className="page-toolbar">
        <div className="page-toolbar-info">
          <strong>{filtered.length}</strong> slots
        </div>
        <select value={filter} onChange={(e) => setFilter(Number(e.target.value))} className="hotel-filter-select">
          <option value={0}>All activities</option>
          {activities.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>

      <div className="table-card">
        {loading && <div className="state">Loading slots…</div>}
        {error   && <div className="state error">{error}</div>}
        {!loading && !error && filtered.length === 0 && <div className="state">No slots found.</div>}

        {!loading && !error && filtered.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th></th>
                  <th>Slot</th>
                  <th>Activity</th>
                  <th>Departure</th>
                  <th>Duration</th>
                  <th>Price</th>
                  <th>Max</th>
                  <th>Upcoming</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} onClick={() => router.push(`/activities/${s.activity_id}/edit`)} style={{ cursor: 'pointer' }}>
                    <td><div className="thumb" style={s.image_url ? { backgroundImage: `url(${s.image_url})` } : undefined} /></td>
                    <td className="strong">{s.slot_label}</td>
                    <td>{s.activity_name}<div className="muted small">{s.activity_city}</div></td>
                    <td className="muted"><FaClock /> {String(s.departure_time).slice(0,5)}</td>
                    <td className="muted">{s.duration_min} min</td>
                    <td className="strong">INR {Number(s.price_per_person).toLocaleString()}</td>
                    <td className="muted"><FaUsers /> {s.max_persons}</td>
                    <td className="muted">{s.upcoming_bookings}</td>
                    <td><span className={`status-pill ${s.is_active ? 'confirmed' : 'cancelled'}`}>{s.is_active ? 'Active' : 'Disabled'}</span></td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <Link href={`/activities/${s.activity_id}/edit`} className="icon-action" aria-label="Edit"><FaPencilAlt /></Link>
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
