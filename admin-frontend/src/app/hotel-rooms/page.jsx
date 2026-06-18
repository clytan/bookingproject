'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaBed, FaUsers, FaPencilAlt } from 'react-icons/fa';
import AuthGuard from '../../components/AuthGuard.jsx';
import Sidebar from '../../components/Sidebar.jsx';
import Header from '../../components/Header.jsx';
import { api } from '../../lib/api';
import '../../styles/Dashboard.css';
import '../../styles/AdminList.css';

export default function HotelRoomsPage() {
  return (
    <AuthGuard>
      <div className="admin-layout">
        <Sidebar />
        <div className="admin-main">
          <Header title="Hotel Rooms" subtitle="All room types across every property" />
          <Inner />
        </div>
      </div>
    </AuthGuard>
  );
}

function Inner() {
  const router = useRouter();
  const [rooms, setRooms]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [hotelFilter, setHotelFilter] = useState(0);

  useEffect(() => {
    setLoading(true);
    api.adminRoomsList()
      .then((res) => setRooms(res.rooms))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const hotels = useMemo(() => {
    const map = new Map();
    rooms.forEach((r) => { if (!map.has(r.hotel_id)) map.set(r.hotel_id, r.hotel_name); });
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [rooms]);

  const filtered = hotelFilter ? rooms.filter((r) => r.hotel_id === hotelFilter) : rooms;

  const totalUnits = filtered.reduce((s, r) => s + r.total_rooms, 0);

  return (
    <div className="dashboard-content">
      <div className="page-toolbar">
        <div className="page-toolbar-info">
          <strong>{filtered.length}</strong> room types · <strong>{totalUnits}</strong> total units
        </div>
        <select
          value={hotelFilter}
          onChange={(e) => setHotelFilter(Number(e.target.value))}
          className="hotel-filter-select"
        >
          <option value={0}>All hotels</option>
          {hotels.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
        </select>
      </div>

      <div className="table-card">
        {loading && <div className="state">Loading rooms…</div>}
        {error   && <div className="state error">{error}</div>}
        {!loading && !error && filtered.length === 0 && (
          <div className="state">No rooms found.</div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th></th>
                  <th>Room Type</th>
                  <th>Hotel</th>
                  <th>Price / Night</th>
                  <th>Capacity</th>
                  <th>Units</th>
                  <th>Upcoming</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => router.push(`/hotels/${r.hotel_id}/edit`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <div className="thumb" style={r.image_url ? { backgroundImage: `url(${r.image_url})` } : undefined} />
                    </td>
                    <td className="strong">{r.room_type}</td>
                    <td>
                      {r.hotel_name}
                      <div className="muted small">{r.hotel_city}</div>
                    </td>
                    <td className="strong">INR {Number(r.price_per_night).toLocaleString()}</td>
                    <td className="muted"><FaUsers /> {r.capacity}</td>
                    <td className="muted"><FaBed /> {r.total_rooms}</td>
                    <td className="muted">{r.upcoming_bookings}</td>
                    <td>
                      <span className={`status-pill ${r.is_active ? 'confirmed' : 'cancelled'}`}>
                        {r.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <Link
                        href={`/hotels/${r.hotel_id}/edit`}
                        className="icon-action"
                        aria-label="Edit in hotel"
                      >
                        <FaPencilAlt />
                      </Link>
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
