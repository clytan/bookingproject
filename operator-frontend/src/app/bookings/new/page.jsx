'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaArrowLeft, FaCheckCircle, FaClock, FaUsers } from 'react-icons/fa';
import AuthGuard from '../../../components/AuthGuard';
import Sidebar from '../../../components/Sidebar';
import Header from '../../../components/Header';
import { api } from '../../../lib/api';
import '../../Dashboard.css';
import './NewBooking.css';

const today = () => new Date().toISOString().slice(0, 10);

export default function NewBookingPage() {
  return (
    <AuthGuard>
      <div className="m-layout">
        <Sidebar />
        <div className="m-main">
          <Header title="New Walk-in Booking" subtitle="Book an arriving guest directly" />
          <Inner />
        </div>
      </div>
    </AuthGuard>
  );
}

function Inner() {
  const router = useRouter();
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  const [activityId, setActivityId] = useState(0);
  const [slots, setSlots]           = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [avail, setAvail]           = useState({});

  const [f, setF] = useState({
    slot_id: 0, date: today(), persons: 2,
    guest_name: '', guest_email: '', guest_phone: '', notes: '',
  });

  const [error, setError]     = useState('');
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    api.activitiesList()
      .then((res) => {
        const active = res.activities.filter((a) => a.is_active);
        setActivities(active);
        if (active.length > 0) setActivityId(active[0].id);
      })
      .catch((e) => setError(e.message))
      .finally(() => setActivitiesLoading(false));
  }, []);

  useEffect(() => {
    if (!activityId) return;
    setLoadingSlots(true);
    api.slotsList(activityId)
      .then((res) => setSlots(res.slots.filter((s) => s.is_active)))
      .catch((e) => setError(e.message))
      .finally(() => setLoadingSlots(false));
    setF((prev) => ({ ...prev, slot_id: 0 }));
  }, [activityId]);

  useEffect(() => {
    if (!activityId || !f.date) return;
    api.availability({ activity_id: activityId, date: f.date })
      .then((res) => setAvail(res.slots || {}))
      .catch(() => setAvail({}));
  }, [activityId, f.date]);

  const selectedSlot = slots.find((s) => s.id === Number(f.slot_id));
  const total = selectedSlot ? selectedSlot.price_per_person * Number(f.persons) : 0;

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!f.slot_id) { setError('Pick a slot'); return; }
    if (!f.guest_name.trim()) { setError('Guest name is required'); return; }
    setSaving(true);
    try {
      const res = await api.bookingCreate({ ...f, slot_id: Number(f.slot_id), persons: Number(f.persons) });
      setSuccess(res.booking);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  if (success) {
    return (
      <div className="m-content">
        <div className="success-box">
          <FaCheckCircle className="success-icon" />
          <h2>Booking created</h2>
          <p>Reference: <strong>{success.booking_code}</strong></p>
          <div className="success-grid">
            <Row label="Guest"     value={success.guest_name} />
            <Row label="Activity"  value={success.activity} />
            <Row label="Slot"      value={success.slot_label} />
            <Row label="Departure" value={String(success.departure_time).slice(0,5)} />
            <Row label="Date"      value={success.date} />
            <Row label="Persons"   value={success.persons} />
            <Row label="Total"     value={`INR ${Number(success.total_amount).toLocaleString()}`} highlight />
          </div>
          <div className="success-actions">
            <button className="m-btn-ghost" onClick={() => router.push('/bookings')}>View all bookings</button>
            <button className="m-btn-primary" onClick={() => { setSuccess(null); setF({ ...f, guest_name: '', guest_email: '', guest_phone: '', notes: '' }); }}>
              Create another
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (activitiesLoading) return <div className="m-content"><div className="m-state">Loading…</div></div>;
  if (activities.length === 0) {
    return (
      <div className="m-content">
        <div className="m-state">
          You don&apos;t have any active activities yet.
          <Link href="/activities/new" className="m-btn-primary" style={{ marginTop: 12, display: 'inline-flex' }}>
            Add an activity first
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="m-content">
      <Link href="/bookings" className="back-link"><FaArrowLeft /> Back to bookings</Link>

      <form className="new-form" onSubmit={submit}>
        <div className="form-section">
          <h3>Activity & date</h3>
          <div className="m-form-grid">
            <label className="m-form-field">
              <span>Activity *</span>
              <select value={activityId} onChange={(e) => setActivityId(Number(e.target.value))}>
                {activities.map((a) => <option key={a.id} value={a.id}>{a.name} — {a.city}</option>)}
              </select>
            </label>
            <label className="m-form-field">
              <span>Date *</span>
              <input type="date" value={f.date} min={today()} onChange={set('date')} required />
            </label>
            <label className="m-form-field">
              <span>Persons *</span>
              <input type="number" min="1" max="50" value={f.persons} onChange={set('persons')} required />
            </label>
          </div>
        </div>

        <div className="form-section">
          <h3>Slot</h3>
          {loadingSlots ? <div className="m-state">Loading slots…</div> :
           slots.length === 0 ? <div className="m-state">This activity has no slots yet.</div> : (
            <div className="room-picker">
              {slots.map((s) => {
                const a = avail[s.id];
                const free = a ? a.available : s.max_persons;
                const soldOut = a && a.fully_booked;
                const tooSmall = s.max_persons < Number(f.persons);
                const disabled = soldOut || tooSmall;
                const selected = Number(f.slot_id) === s.id;
                return (
                  <button
                    type="button"
                    key={s.id}
                    className={`room-pick ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
                    onClick={() => !disabled && setF({ ...f, slot_id: s.id })}
                    disabled={disabled}
                  >
                    <div className="rp-img" style={s.image_url ? { backgroundImage: `url(${s.image_url})` } : undefined} />
                    <div className="rp-body">
                      <div className="rp-top">
                        <strong>{s.slot_label}</strong>
                        <span className="rp-price">INR {Number(s.price_per_person).toLocaleString()}<small>/person</small></span>
                      </div>
                      <div className="rp-meta">
                        <span><FaClock /> {String(s.departure_time).slice(0,5)} · {s.duration_min} min</span>
                        <span><FaUsers /> Max {s.max_persons}</span>
                        <span className={`rp-avail ${soldOut ? 'red' : free <= 2 ? 'amber' : 'green'}`}>
                          {soldOut ? 'Sold out' : `${free} of ${s.max_persons} left`}
                        </span>
                      </div>
                      {tooSmall && !soldOut && <div className="rp-warn">Too small for {f.persons} persons</div>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="form-section">
          <h3>Guest details</h3>
          <div className="m-form-grid">
            <label className="m-form-field">
              <span>Full Name *</span>
              <input value={f.guest_name} onChange={set('guest_name')} placeholder="e.g. Rahul Sharma" required />
            </label>
            <label className="m-form-field">
              <span>Email</span>
              <input type="email" value={f.guest_email} onChange={set('guest_email')} placeholder="optional" />
            </label>
            <label className="m-form-field">
              <span>Phone</span>
              <input value={f.guest_phone} onChange={set('guest_phone')} placeholder="optional" />
            </label>
            <label className="m-form-field full">
              <span>Notes</span>
              <input value={f.notes} onChange={set('notes')} placeholder="Special requests, payment details..." />
            </label>
          </div>
        </div>

        {selectedSlot && (
          <div className="summary-bar">
            <div>
              <strong>{selectedSlot.slot_label}</strong> · {f.persons} person{Number(f.persons) > 1 ? 's' : ''} on {f.date}
            </div>
            <div className="summary-total">INR {Number(total).toLocaleString()}</div>
          </div>
        )}

        {error && <div className="m-state error" style={{ padding: 12 }}>{error}</div>}

        <div className="form-foot">
          <Link href="/bookings" className="m-btn-ghost">Cancel</Link>
          <button type="submit" className="m-btn-primary" disabled={saving || !f.slot_id}>
            {saving ? 'Creating…' : 'Confirm Booking'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Row({ label, value, highlight }) {
  return (
    <div className={`s-row ${highlight ? 'h' : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
