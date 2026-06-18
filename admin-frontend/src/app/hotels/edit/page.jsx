'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { FaPlus, FaPencilAlt, FaTrash, FaBed, FaUsers, FaCheck } from 'react-icons/fa';
import AuthGuard from '../../../components/AuthGuard.jsx';
import Sidebar from '../../../components/Sidebar.jsx';
import Header from '../../../components/Header.jsx';
import HotelForm from '../../../components/HotelForm.jsx';
import { api } from '../../../lib/api';
import '../../../styles/Dashboard.css';
import '../../../styles/AdminList.css';
import '../../../styles/HotelForm.css';
import '../../../styles/RoomManager.css';

const EMPTY_ROOM = {
  id: 0, room_type: '', description: '', price_per_night: '',
  capacity: 2, total_rooms: 1, image_url: '', amenities: '', is_active: true,
};

function EditHotelInner() {
  const params = useSearchParams();
  const id     = params.get('id');
  const saved  = params.get('saved') === '1';

  const [hotel, setHotel]     = useState(null);
  const [rooms, setRooms]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [editingRoom, setEditingRoom] = useState(null);

  const load = () => {
    setLoading(true);
    api.adminHotelGet(id)
      .then((res) => { setHotel(res.hotel); setRooms(res.rooms); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(() => { if (id) load(); }, [id]);

  const deleteRoom = async (room) => {
    if (!confirm(`Delete "${room.room_type}"?`)) return;
    try { await api.adminRoomDelete(room.id); load(); }
    catch (e) { alert(e.message); }
  };

  if (loading) return <Shell><div className="state">Loading…</div></Shell>;
  if (error)   return <Shell><div className="state error">{error}</div></Shell>;
  if (!hotel)  return null;

  return (
    <Shell>
      {saved && <div className="save-banner"><FaCheck /> Changes saved.</div>}
      <HotelForm initial={hotel} title={`Editing: ${hotel.name}`} />

      <div className="room-manager">
        <div className="rm-head">
          <div>
            <h3>Rooms</h3>
            <p>Manage room types and inventory for this hotel</p>
          </div>
          <button className="primary-btn" onClick={() => setEditingRoom({ ...EMPTY_ROOM })}>
            <FaPlus /> Add Room Type
          </button>
        </div>

        {rooms.length === 0 ? (
          <div className="state">No room types yet. Add one to make this hotel bookable.</div>
        ) : (
          <div className="rm-grid">
            {rooms.map((r) => (
              <div key={r.id} className="rm-card">
                <div className="rm-img" style={r.image_url ? { backgroundImage: `url(${r.image_url})` } : undefined}>
                  {!r.is_active && <span className="rm-disabled">Disabled</span>}
                </div>
                <div className="rm-body">
                  <div className="rm-top">
                    <h4>{r.room_type}</h4>
                    <span className="rm-price">INR {Number(r.price_per_night).toLocaleString()}<small>/night</small></span>
                  </div>
                  <p className="rm-desc">{r.description || '—'}</p>
                  <div className="rm-tags">
                    <span><FaUsers /> {r.capacity}</span>
                    <span><FaBed /> {r.total_rooms} unit{r.total_rooms > 1 ? 's' : ''}</span>
                  </div>
                  <div className="rm-actions">
                    <button className="icon-action" onClick={() => setEditingRoom({ ...r })}><FaPencilAlt /></button>
                    <button className="icon-action danger" onClick={() => deleteRoom(r)}><FaTrash /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingRoom && (
        <RoomModal
          hotelId={Number(id)}
          room={editingRoom}
          onClose={() => setEditingRoom(null)}
          onSaved={() => { setEditingRoom(null); load(); }}
        />
      )}
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <AuthGuard>
      <div className="admin-layout">
        <Sidebar />
        <div className="admin-main">
          <Header title="Edit Hotel" subtitle="Update hotel info and manage rooms" />
          <div className="dashboard-content">{children}</div>
        </div>
      </div>
    </AuthGuard>
  );
}

function RoomModal({ hotelId, room, onClose, onSaved }) {
  const [f, setF] = useState(room);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setF({ ...f, [k]: v });
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setSaving(true);
    try {
      await api.adminRoomSave({
        ...f, hotel_id: hotelId,
        price_per_night: Number(f.price_per_night),
        capacity: Number(f.capacity),
        total_rooms: Number(f.total_rooms),
      });
      onSaved();
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-bg" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h3>{f.id ? 'Edit Room Type' : 'Add Room Type'}</h3>

        <div className="hf-grid">
          <label className="hf-field full">
            <span>Room Type *</span>
            <input value={f.room_type} onChange={set('room_type')} required />
          </label>
          <label className="hf-field full">
            <span>Description</span>
            <input value={f.description || ''} onChange={set('description')} />
          </label>
          <label className="hf-field">
            <span>Price/Night (INR) *</span>
            <input type="number" min="0" step="100" value={f.price_per_night} onChange={set('price_per_night')} required />
          </label>
          <label className="hf-field">
            <span>Capacity *</span>
            <input type="number" min="1" max="20" value={f.capacity} onChange={set('capacity')} required />
          </label>
          <label className="hf-field">
            <span>Total Units *</span>
            <input type="number" min="1" max="500" value={f.total_rooms} onChange={set('total_rooms')} required />
          </label>
          <label className="hf-field full">
            <span>Image URL</span>
            <input value={f.image_url || ''} onChange={set('image_url')} placeholder="https://..." />
          </label>
          <label className="hf-field full">
            <span>Amenities</span>
            <input value={f.amenities || ''} onChange={set('amenities')} placeholder="AC, TV, Mini bar" />
          </label>
          <label className="hf-field">
            <span>Active</span>
            <div className="hf-switch">
              <input type="checkbox" id="r-active" checked={!!f.is_active} onChange={set('is_active')} />
              <label htmlFor="r-active">{f.is_active ? 'Available' : 'Hidden'}</label>
            </div>
          </label>
        </div>

        {err && <div className="hf-error">{err}</div>}

        <div className="modal-actions">
          <button type="button" className="hf-btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="hf-btn-primary" disabled={saving}>
            {saving ? 'Saving…' : (f.id ? 'Save' : 'Add room')}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function EditHotelPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40 }}>Loading…</div>}>
      <EditHotelInner />
    </Suspense>
  );
}
