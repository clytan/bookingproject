'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaPlus, FaStar, FaPencilAlt, FaTrash } from 'react-icons/fa';
import AuthGuard from '../../components/AuthGuard.jsx';
import Sidebar from '../../components/Sidebar.jsx';
import Header from '../../components/Header.jsx';
import { api } from '../../lib/api';
import '../../styles/Dashboard.css';
import '../../styles/AdminList.css';

export default function AdminHotelsPage() {
  return (
    <AuthGuard>
      <div className="admin-layout">
        <Sidebar />
        <div className="admin-main">
          <Header title="Hotels" subtitle="Manage hotel properties and inventory" />
          <Inner />
        </div>
      </div>
    </AuthGuard>
  );
}

function Inner() {
  const router = useRouter();
  const [hotels, setHotels]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const load = () => {
    setLoading(true);
    api.adminHotelsList()
      .then((res) => setHotels(res.hotels))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const remove = async (h) => {
    if (!confirm(`Delete "${h.name}"? This removes all rooms too. Cannot undo.`)) return;
    try { await api.adminHotelDelete(h.id); load(); }
    catch (e) { alert(e.message); }
  };

  return (
    <div className="dashboard-content">
      <div className="page-toolbar">
        <div className="page-toolbar-info">
          <strong>{hotels.length}</strong> hotels total
        </div>
        <Link href="/hotels/new" className="primary-btn"><FaPlus /> Add Hotel</Link>
      </div>

      <div className="table-card">
        {loading && <div className="state">Loading hotels…</div>}
        {error && <div className="state error">{error}</div>}

        {!loading && !error && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th></th>
                  <th>Name</th>
                  <th>City</th>
                  <th>Stars</th>
                  <th>Rating</th>
                  <th>Rooms</th>
                  <th>Bookings</th>
                  <th>Comm %</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {hotels.map((h) => (
                  <tr key={h.id} onClick={() => router.push(`/hotels/edit?id=${h.id}`)} style={{ cursor: 'pointer' }}>
                    <td><div className="thumb" style={{ backgroundImage: `url(${h.image_url})` }} /></td>
                    <td className="strong">{h.name}</td>
                    <td>{h.city}</td>
                    <td>{'⭐'.repeat(h.star_rating)}</td>
                    <td><span className="rating-cell"><FaStar /> {h.user_rating}</span></td>
                    <td className="muted">{h.room_count}</td>
                    <td className="muted">{h.booking_count}</td>
                    <td className="strong">{Number(h.commission_percent || 0).toFixed(h.commission_percent % 1 === 0 ? 0 : 1)}%</td>
                    <td><span className={`status-pill ${h.is_active ? 'confirmed' : 'cancelled'}`}>{h.is_active ? 'Active' : 'Disabled'}</span></td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Link href={`/hotels/edit?id=${h.id}`} className="icon-action" aria-label="Edit"><FaPencilAlt /></Link>
                        <button className="icon-action danger" onClick={() => remove(h)} aria-label="Delete"><FaTrash /></button>
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
