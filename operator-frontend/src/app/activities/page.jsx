'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaPlus, FaPencilAlt, FaTrash, FaWater, FaMapMarkerAlt, FaClock } from 'react-icons/fa';
import AuthGuard from '../../components/AuthGuard';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { api } from '../../lib/api';
import '../Dashboard.css';
import './Activities.css';

const CAT_LABEL = {
  snorkeling: 'Snorkeling', scuba_diving: 'Scuba Diving', surfing: 'Surfing',
  jet_ski: 'Jet Ski', kayaking: 'Kayaking', whale_watching: 'Whale Watching',
  banana_boat: 'Banana Boat', parasailing: 'Parasailing',
  catamaran_sailing: 'Catamaran Sailing', other: 'Other',
};

export default function MyActivitiesPage() {
  return (
    <AuthGuard>
      <div className="m-layout">
        <Sidebar />
        <div className="m-main">
          <Header title="My Activities" subtitle="All water activities run by your company" />
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
    api.activitiesList()
      .then((res) => setItems(res.activities))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const remove = async (a) => {
    if (!confirm(`Delete "${a.name}"? This removes all slots too.`)) return;
    try { await api.activityDelete(a.id); load(); }
    catch (e) { alert(e.message); }
  };

  return (
    <div className="m-content">
      <div className="m-toolbar">
        <div><strong>{items.length}</strong> activit{items.length === 1 ? 'y' : 'ies'}</div>
        <Link href="/activities/new" className="m-btn-primary"><FaPlus /> Add Activity</Link>
      </div>

      {loading && <div className="m-state">Loading activities…</div>}
      {error && <div className="m-state error">{error}</div>}

      {!loading && !error && items.length === 0 && (
        <div className="m-state">
          You haven&apos;t added any activities yet.
          <Link href="/activities/new" className="m-btn-primary" style={{ marginTop: 12, display: 'inline-flex' }}>
            <FaPlus /> Add your first activity
          </Link>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="act-grid">
          {items.map((a) => (
            <div key={a.id} className="act-card">
              <div className="act-img" style={a.image_url ? { backgroundImage: `url(${a.image_url})` } : undefined}>
                {!a.is_active && <span className="act-disabled">Disabled</span>}
              </div>
              <div className="act-body">
                <div className="act-top">
                  <h3>{a.name}</h3>
                  <span className="act-cat">{CAT_LABEL[a.category] || a.category}</span>
                </div>
                <p className="act-meta"><FaMapMarkerAlt /> {a.city}</p>
                <p className="act-desc">{a.description?.slice(0, 110) || '—'}{a.description && a.description.length > 110 ? '…' : ''}</p>
                <div className="act-tags">
                  <span><FaClock /> {a.duration_min} min</span>
                  <span><FaWater /> {a.difficulty}</span>
                  <span className={`up-pill ${a.upcoming_bookings > 0 ? 'busy' : ''}`}>
                    {a.upcoming_bookings} upcoming
                  </span>
                </div>
                <div className="act-foot">
                  <Link href={`/activities/${a.id}/edit`} className="m-btn-ghost"><FaPencilAlt /> Manage</Link>
                  <button className="m-btn-danger" onClick={() => remove(a)}><FaTrash /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
