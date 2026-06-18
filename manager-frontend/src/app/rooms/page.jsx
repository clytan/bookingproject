'use client';

import { useEffect, useState } from 'react';
import { FaPlus, FaPencilAlt, FaTrash, FaBed, FaUsers } from 'react-icons/fa';
import AuthGuard from '../../components/AuthGuard';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { api } from '../../lib/api';
import '../Dashboard.css';
import './Rooms.css';

const EMPTY = {
  id: 0, room_type: '', description: '', price_per_night: '', capacity: 2,
  total_rooms: 1, image_url: '', amenities: '', is_active: true,
};

export default function RoomsPage() {
  return (
    <AuthGuard>
      <div className="m-layout">
        <Sidebar />
        <div className="m-main">
          <Header title="Rooms" subtitle="Manage room types and inventory" />
          <Inner />
        </div>
      </div>
    </AuthGuard>
  );
}

function Inner() {
  const [rooms, setRooms]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [editing, setEditing] = useState(null);

  const load = () => {
    setLoading(true);
    api.roomsList()
      .then((res) => setRooms(res.rooms))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const onDelete = async (room) => {
    if (!confirm(`Delete "${room.room_type}"? This cannot be undone.`)) return;
    try { await api.roomDelete(room.id); load(); }
    catch (e) { alert(e.message); }
  };

  return (
    <div className="m-content">
      <div className="m-toolbar">
        <div><strong>{rooms.length}</strong> room types</div>
        <button className="m-btn-primary" onClick={() => setEditing({ ...EMPTY })}><FaPlus /> Add Room Type</button>
      </div>

      {loading && <div className="m-state">Loading rooms…</div>}
      {error && <div className="m-state error">{error}</div>}

      {!loading && !error && (
        <div className="rooms-grid">
          {rooms.map((r) => (
            <div key={r.id} className="room-card">
              <div className="room-img" style={r.image_url ? { backgroundImage: `url(${r.image_url})` } : undefined}>
                {!r.is_active && <span className="room-disabled">Disabled</span>}
              </div>
              <div className="room-card-body">
                <div className="room-card-head">
                  <h3>{r.room_type}</h3>
                  <span className="price">INR {Number(r.price_per_night).toLocaleString()}<small>/night</small></span>
                </div>
                <p className="room-desc">{r.description || '—'}</p>
                <div className="room-tags">
                  <span><FaUsers /> Up to {r.capacity}</span>
                  <span><FaBed /> {r.total_rooms} unit{r.total_rooms > 1 ? 's' : ''}</span>
                  <span className={`up-pill ${r.upcoming_bookings > 0 ? 'busy' : ''}`}>
                    {r.upcoming_bookings} upcoming
                  </span>
                </div>
                <div className="room-actions">
                  <button className="m-btn-ghost" onClick={() => setEditing({ ...r })}><FaPencilAlt /> Edit</button>
                  <button className="m-btn-danger" onClick={() => onDelete(r)}><FaTrash /> Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <RoomFormModal
          room={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

function RoomFormModal({ room, onClose, onSaved }) {
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
      await api.roomSave({
        ...f,
        price_per_night: Number(f.price_per_night),
        capacity: Number(f.capacity),
        total_rooms: Number(f.total_rooms),
      });
      onSaved();
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="m-modal-backdrop" onClick={onClose}>
      <form className="m-modal" onSubmit={submit} onClick={(e) => e.stopPropagation()}>
        <h2>{f.id ? 'Edit Room Type' : 'Add Room Type'}</h2>

        <div className="m-form-grid">
          <label className="m-form-field full">
            <span>Room Type *</span>
            <input value={f.room_type} onChange={set('room_type')} placeholder="Deluxe Room" required />
          </label>
          <label className="m-form-field full">
            <span>Description</span>
            <input value={f.description || ''} onChange={set('description')} placeholder="City-view room with king bed" />
          </label>
          <label className="m-form-field">
            <span>Price per Night (INR) *</span>
            <input type="number" min="0" step="100" value={f.price_per_night} onChange={set('price_per_night')} required />
          </label>
          <label className="m-form-field">
            <span>Capacity (guests) *</span>
            <input type="number" min="1" max="20" value={f.capacity} onChange={set('capacity')} required />
          </label>
          <label className="m-form-field">
            <span>Total Units *</span>
            <input type="number" min="1" max="500" value={f.total_rooms} onChange={set('total_rooms')} required />
          </label>
          <label className="m-form-field">
            <span>Active</span>
            <div className="m-switch">
              <input type="checkbox" id="r-active" checked={!!f.is_active} onChange={set('is_active')} />
              <label htmlFor="r-active">{f.is_active ? 'Available for booking' : 'Hidden from users'}</label>
            </div>
          </label>
          <label className="m-form-field full">
            <span>Image URL</span>
            <input value={f.image_url || ''} onChange={set('image_url')} placeholder="https://..." />
          </label>
          <label className="m-form-field full">
            <span>Amenities (comma separated)</span>
            <input value={f.amenities || ''} onChange={set('amenities')} placeholder="AC, TV, Mini bar, Safe" />
          </label>
        </div>

        {err && <div className="m-state error" style={{ padding: 10, fontSize: 13 }}>{err}</div>}

        <div className="m-modal-actions">
          <button type="button" className="m-btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="m-btn-primary" disabled={saving}>
            {saving ? 'Saving…' : (f.id ? 'Save changes' : 'Create room')}
          </button>
        </div>
      </form>
    </div>
  );
}
