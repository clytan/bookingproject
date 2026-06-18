'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { FaPlus, FaPencilAlt, FaTrash, FaClock, FaUsers, FaCheck } from 'react-icons/fa';
import AuthGuard from '../../../../components/AuthGuard';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import ActivityForm from '../../../../components/ActivityForm';
import { api } from '../../../../lib/api';
import '../../../Dashboard.css';
import '../../../bookings/new/NewBooking.css';

const EMPTY_SLOT = {
  id: 0, slot_label: '', description: '', departure_time: '09:00',
  duration_min: 60, price_per_person: '', max_persons: 10,
  image_url: '', includes: '', is_active: true,
};

function EditActivityInner() {
  const { id } = useParams();
  const params = useSearchParams();
  const saved  = params.get('saved') === '1';

  const [activity, setActivity] = useState(null);
  const [slots, setSlots]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [editingSlot, setEditingSlot] = useState(null);

  const load = () => {
    setLoading(true);
    api.activityGet(id)
      .then((res) => { setActivity(res.activity); setSlots(res.slots); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(() => { if (id) load(); }, [id]);

  const deleteSlot = async (slot) => {
    if (!confirm(`Delete "${slot.slot_label}"?`)) return;
    try { await api.slotDelete(slot.id); load(); }
    catch (e) { alert(e.message); }
  };

  if (loading) return <Shell><div className="m-state">Loading…</div></Shell>;
  if (error)   return <Shell><div className="m-state error">{error}</div></Shell>;
  if (!activity) return null;

  return (
    <Shell>
      {saved && <div className="m-state" style={{ background: '#d1fae5', color: '#065f46', borderRadius: 10, marginBottom: 16 }}>
        <FaCheck /> Changes saved.
      </div>}
      <ActivityForm initial={activity} title={`Editing: ${activity.name}`} />

      <div className="m-card-wrap" style={{ marginTop: 28 }}>
        <div className="m-card-head">
          <div>
            <h3>Slots / Departures</h3>
            <p>Manage time slots, prices and capacity for this activity</p>
          </div>
          <button className="m-btn-primary" onClick={() => setEditingSlot({ ...EMPTY_SLOT })}>
            <FaPlus /> Add Slot
          </button>
        </div>

        {slots.length === 0 ? (
          <div className="m-state">No slots yet. Add one to make this activity bookable.</div>
        ) : (
          <table className="m-table">
            <thead>
              <tr>
                <th>Slot</th><th>Description</th><th>Departure</th><th>Duration</th><th>Price</th><th>Max</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {slots.map((s) => (
                <tr key={s.id}>
                  <td className="strong">{s.slot_label}</td>
                  <td className="muted">{s.description || '—'}</td>
                  <td><FaClock /> {String(s.departure_time).slice(0,5)}</td>
                  <td>{s.duration_min} min</td>
                  <td className="strong">INR {Number(s.price_per_person).toLocaleString()}</td>
                  <td><FaUsers /> {s.max_persons}</td>
                  <td><span className={`pill ${s.is_active ? 'confirmed' : 'cancelled'}`}>{s.is_active ? 'Active' : 'Disabled'}</span></td>
                  <td>
                    <div className="row-actions">
                      <button className="link confirm" onClick={() => setEditingSlot({ ...s })}><FaPencilAlt /></button>
                      <button className="link cancel" onClick={() => deleteSlot(s)}><FaTrash /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
      <div className="m-layout">
        <Sidebar />
        <div className="m-main">
          <Header title="Edit Activity" subtitle="Update activity info and manage slots" />
          <div className="m-content">{children}</div>
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
      await api.slotSave({
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
    <div className="m-modal-backdrop" onClick={onClose}>
      <form className="m-modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2>{f.id ? 'Edit Slot' : 'Add Slot'}</h2>

        <div className="m-form-grid">
          <label className="m-form-field full">
            <span>Slot Label *</span>
            <input value={f.slot_label} onChange={set('slot_label')} placeholder="Morning Departure" required />
          </label>
          <label className="m-form-field full">
            <span>Description</span>
            <input value={f.description || ''} onChange={set('description')} placeholder="Boat leaves at 9am, back by 3pm" />
          </label>
          <label className="m-form-field">
            <span>Departure Time *</span>
            <input type="time" value={f.departure_time?.toString().slice(0,5) || '09:00'} onChange={set('departure_time')} required />
          </label>
          <label className="m-form-field">
            <span>Duration (min) *</span>
            <input type="number" min="1" value={f.duration_min} onChange={set('duration_min')} required />
          </label>
          <label className="m-form-field">
            <span>Price / Person (INR) *</span>
            <input type="number" min="0" step="50" value={f.price_per_person} onChange={set('price_per_person')} required />
          </label>
          <label className="m-form-field">
            <span>Max Persons *</span>
            <input type="number" min="1" max="500" value={f.max_persons} onChange={set('max_persons')} required />
          </label>
          <label className="m-form-field full">
            <span>Image URL</span>
            <input value={f.image_url || ''} onChange={set('image_url')} placeholder="https://..." />
          </label>
          <label className="m-form-field full">
            <span>Includes</span>
            <input value={f.includes || ''} onChange={set('includes')} placeholder="Gear, Lunch, Guide" />
          </label>
          <label className="m-form-field">
            <span>Active</span>
            <div className="m-switch">
              <input type="checkbox" id="s-active" checked={!!f.is_active} onChange={set('is_active')} />
              <label htmlFor="s-active">{f.is_active ? 'Available' : 'Hidden'}</label>
            </div>
          </label>
        </div>

        {err && <div className="m-state error" style={{ padding: 10, fontSize: 13 }}>{err}</div>}

        <div className="m-modal-actions">
          <button type="button" className="m-btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="m-btn-primary" disabled={saving}>
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
