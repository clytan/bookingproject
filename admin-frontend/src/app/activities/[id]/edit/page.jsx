'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { FaPlus, FaPencilAlt, FaTrash, FaClock, FaUsers, FaCheck } from 'react-icons/fa';
import AuthGuard from '../../../../components/AuthGuard.jsx';
import Sidebar from '../../../../components/Sidebar.jsx';
import Header from '../../../../components/Header.jsx';
import ActivityForm from '../../../../components/ActivityForm.jsx';
import { api } from '../../../../lib/api';
import '../../../../styles/Dashboard.css';
import '../../../../styles/AdminList.css';
import '../../../../styles/HotelForm.css';
import '../../../../styles/RoomManager.css';

const EMPTY_SLOT = {
  id: 0, slot_label: '', description: '', departure_time: '09:00',
  duration_min: 60, price_per_person: '', max_persons: 10,
  image_url: '', includes: '', is_active: true,
};

function EditActivityInner() {
  const { id }  = useParams();
  const params  = useSearchParams();
  const saved   = params.get('saved') === '1';

  const [activity, setActivity] = useState(null);
  const [slots, setSlots]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [editingSlot, setEditingSlot] = useState(null);

  const load = () => {
    setLoading(true);
    api.adminActivityGet(id)
      .then((res) => { setActivity(res.activity); setSlots(res.slots); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(() => { if (id) load(); }, [id]);

  const deleteSlot = async (slot) => {
    if (!confirm(`Delete "${slot.slot_label}"?`)) return;
    try { await api.adminSlotDelete(slot.id); load(); }
    catch (e) { alert(e.message); }
  };

  if (loading) return <Shell><div className="state">Loading…</div></Shell>;
  if (error)   return <Shell><div className="state error">{error}</div></Shell>;
  if (!activity) return null;

  return (
    <Shell>
      {saved && <div className="save-banner"><FaCheck /> Changes saved.</div>}
      <ActivityForm initial={activity} title={`Editing: ${activity.name}`} />

      <div className="room-manager">
        <div className="rm-head">
          <div>
            <h3>Slots / Departures</h3>
            <p>Manage time slots, prices and capacity</p>
          </div>
          <button className="primary-btn" onClick={() => setEditingSlot({ ...EMPTY_SLOT })}>
            <FaPlus /> Add Slot
          </button>
        </div>

        {slots.length === 0 ? (
          <div className="state">No slots yet. Add one to make this activity bookable.</div>
        ) : (
          <div className="rm-grid">
            {slots.map((s) => (
              <div key={s.id} className="rm-card">
                <div className="rm-img" style={s.image_url ? { backgroundImage: `url(${s.image_url})` } : undefined}>
                  {!s.is_active && <span className="rm-disabled">Disabled</span>}
                </div>
                <div className="rm-body">
                  <div className="rm-top">
                    <h4>{s.slot_label}</h4>
                    <span className="rm-price">INR {Number(s.price_per_person).toLocaleString()}<small>/person</small></span>
                  </div>
                  <p className="rm-desc">{s.description || '—'}</p>
                  <div className="rm-tags">
                    <span><FaClock /> {String(s.departure_time).slice(0, 5)} · {s.duration_min} min</span>
                    <span><FaUsers /> Max {s.max_persons}</span>
                  </div>
                  <div className="rm-actions">
                    <button className="icon-action" onClick={() => setEditingSlot({ ...s })}><FaPencilAlt /></button>
                    <button className="icon-action danger" onClick={() => deleteSlot(s)}><FaTrash /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingSlot && (
        <SlotModal
          activityId={Number(id)}
          slot={editingSlot}
          onClose={() => setEditingSlot(null)}
          onSaved={() => { setEditingSlot(null); load(); }}
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
          <Header title="Edit Activity" subtitle="Update activity info and manage slots" />
          <div className="dashboard-content">{children}</div>
        </div>
      </div>
    </AuthGuard>
  );
}

function SlotModal({ activityId, slot, onClose, onSaved }) {
  const [f, setF] = useState(slot);
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
      await api.adminSlotSave({
        ...f, activity_id: activityId,
        price_per_person: Number(f.price_per_person),
        max_persons:      Number(f.max_persons),
        duration_min:     Number(f.duration_min),
      });
      onSaved();
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-bg" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h3>{f.id ? 'Edit Slot' : 'Add Slot'}</h3>

        <div className="hf-grid">
          <label className="hf-field full">
            <span>Slot Label *</span>
            <input value={f.slot_label} onChange={set('slot_label')} placeholder="Morning Departure" required />
          </label>
          <label className="hf-field full">
            <span>Description</span>
            <input value={f.description || ''} onChange={set('description')} placeholder="Boat leaves at 9am, back by 3pm" />
          </label>
          <label className="hf-field">
            <span>Departure Time *</span>
            <input type="time" value={f.departure_time?.toString().slice(0,5) || '09:00'} onChange={set('departure_time')} required />
          </label>
          <label className="hf-field">
            <span>Duration (min) *</span>
            <input type="number" min="1" value={f.duration_min} onChange={set('duration_min')} required />
          </label>
          <label className="hf-field">
            <span>Price / Person (INR) *</span>
            <input type="number" min="0" step="50" value={f.price_per_person} onChange={set('price_per_person')} required />
          </label>
          <label className="hf-field">
            <span>Max Persons *</span>
            <input type="number" min="1" max="500" value={f.max_persons} onChange={set('max_persons')} required />
          </label>
          <label className="hf-field full">
            <span>Image URL</span>
            <input value={f.image_url || ''} onChange={set('image_url')} placeholder="https://..." />
          </label>
          <label className="hf-field full">
            <span>Includes</span>
            <input value={f.includes || ''} onChange={set('includes')} placeholder="Gear, Guide, Lunch" />
          </label>
          <label className="hf-field">
            <span>Active</span>
            <div className="hf-switch">
              <input type="checkbox" id="s-active" checked={!!f.is_active} onChange={set('is_active')} />
              <label htmlFor="s-active">{f.is_active ? 'Available' : 'Hidden'}</label>
            </div>
          </label>
        </div>

        {err && <div className="hf-error">{err}</div>}

        <div className="modal-actions">
          <button type="button" className="hf-btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="hf-btn-primary" disabled={saving}>
            {saving ? 'Saving…' : (f.id ? 'Save' : 'Add slot')}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function EditActivityPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40 }}>Loading…</div>}>
      <EditActivityInner />
    </Suspense>
  );
}
