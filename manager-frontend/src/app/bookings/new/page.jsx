'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaArrowLeft, FaCheckCircle } from 'react-icons/fa';
import AuthGuard from '../../../components/AuthGuard';
import { useManager } from '../../../components/AuthGuard';
import Sidebar from '../../../components/Sidebar';
import Header from '../../../components/Header';
import { api } from '../../../lib/api';
import '../../Dashboard.css';
import '../../rooms/Rooms.css';
import './NewBooking.css';

const today    = () => new Date().toISOString().slice(0, 10);
const tomorrow = () => new Date(Date.now() + 86400000).toISOString().slice(0, 10);

export default function NewBookingPage() {
  return (
    <AuthGuard>
      <div className="m-layout">
        <Sidebar />
        <div className="m-main">
          <Header title="New Walk-in Booking" subtitle="Reserve a room directly for an arriving guest" />
          <Inner />
        </div>
      </div>
    </AuthGuard>
  );
}

function Inner() {
  const router = useRouter();
  const m = useManager();

  const [rooms, setRooms]       = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [avail, setAvail]       = useState({});

  const [f, setF] = useState({
    room_id: 0, check_in: today(), check_out: tomorrow(), guests: 2,
    guest_name: '', guest_email: '', guest_phone: '', notes: '',
  });

  const [error, setError]     = useState('');
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState(null);

  // Load rooms once
  useEffect(() => {
    api.roomsList()
      .then((res) => setRooms(res.rooms.filter((r) => r.is_active)))
      .catch((e) => setError(e.message))
      .finally(() => setLoadingRooms(false));
  }, []);

  // Refresh availability whenever dates change
  useEffect(() => {
    if (!m || !f.check_in || !f.check_out) return;
    if (new Date(f.check_out) <= new Date(f.check_in)) return;
    api.availability({ hotel_id: m.hotel_id, checkin: f.check_in, checkout: f.check_out })
      .then((res) => setAvail(res.rooms))
      .catch(() => setAvail({}));
  }, [m, f.check_in, f.check_out]);

  const nights = useMemo(() => {
    const a = new Date(f.check_in); const b = new Date(f.check_out);
    return Math.max(0, Math.round((b - a) / 86400000));
  }, [f.check_in, f.check_out]);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const selectedRoom = rooms.find((r) => r.id === Number(f.room_id));
  const total = selectedRoom ? selectedRoom.price_per_night * nights : 0;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!f.room_id) { setError('Pick a room'); return; }
    if (!f.guest_name.trim()) { setError('Guest name is required'); return; }
    if (nights < 1) { setError('Check-out must be after check-in'); return; }
    setSaving(true);
    try {
      const res = await api.bookingCreate({ ...f, room_id: Number(f.room_id), guests: Number(f.guests) });
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
            <Row label="Room"      value={success.room_type} />
            <Row label="Check-in"  value={success.check_in} />
            <Row label="Check-out" value={success.check_out} />
            <Row label="Nights"    value={success.nights} />
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

  return (
    <div className="m-content">
      <Link href="/bookings" className="back-link"><FaArrowLeft /> Back to bookings</Link>

      <form className="new-form" onSubmit={submit}>
        <div className="form-section">
          <h3>Stay details</h3>
          <div className="m-form-grid">
            <label className="m-form-field">
              <span>Check-in *</span>
              <input type="date" value={f.check_in} min={today()} onChange={set('check_in')} required />
            </label>
            <label className="m-form-field">
              <span>Check-out *</span>
              <input type="date" value={f.check_out} min={f.check_in || today()} onChange={set('check_out')} required />
            </label>
            <label className="m-form-field">
              <span>Guests *</span>
              <input type="number" min="1" max="20" value={f.guests} onChange={set('guests')} required />
            </label>
            <label className="m-form-field">
              <span>Nights</span>
              <input value={`${nights} night${nights !== 1 ? 's' : ''}`} disabled />
            </label>
          </div>
        </div>

        <div className="form-section">
          <h3>Room</h3>
          {loadingRooms ? <div className="m-state">Loading rooms…</div> : (
            <div className="room-picker">
              {rooms.map((r) => {
                const a = avail[r.id];
                const free = a ? a.available : r.total_rooms;
                const soldOut = a && a.fully_booked;
                const tooSmall = r.capacity < Number(f.guests);
                const disabled = soldOut || tooSmall;
                const selected = Number(f.room_id) === r.id;
                return (
                  <button
                    type="button"
                    key={r.id}
                    className={`room-pick ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
                    onClick={() => !disabled && setF({ ...f, room_id: r.id })}
                    disabled={disabled}
                  >
                    <div className="rp-img" style={r.image_url ? { backgroundImage: `url(${r.image_url})` } : undefined} />
                    <div className="rp-body">
                      <div className="rp-top">
                        <strong>{r.room_type}</strong>
                        <span className="rp-price">INR {Number(r.price_per_night).toLocaleString()}<small>/night</small></span>
                      </div>
                      <div className="rp-meta">
                        <span>Up to {r.capacity} guests</span>
                        <span className={`rp-avail ${soldOut ? 'red' : free <= 2 ? 'amber' : 'green'}`}>
                          {soldOut ? 'Sold out' : `${free} of ${r.total_rooms} left`}
                        </span>
                      </div>
                      {tooSmall && !soldOut && <div className="rp-warn">Too small for {f.guests} guests</div>}
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
              <input value={f.guest_name} onChange={set('guest_name')} placeholder="e.g. Kavindu Perera" required />
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
              <input value={f.notes} onChange={set('notes')} placeholder="Late check-in, special requests, payment details..." />
            </label>
          </div>
        </div>

        {selectedRoom && nights > 0 && (
          <div className="summary-bar">
            <div>
              <strong>{selectedRoom.room_type}</strong> · {nights} night{nights > 1 ? 's' : ''} · {f.guests} guest{f.guests > 1 ? 's' : ''}
            </div>
            <div className="summary-total">INR {Number(total).toLocaleString()}</div>
          </div>
        )}

        {error && <div className="m-state error" style={{ padding: 12 }}>{error}</div>}

        <div className="form-foot">
          <Link href="/bookings" className="m-btn-ghost">Cancel</Link>
          <button type="submit" className="m-btn-primary" disabled={saving || !f.room_id}>
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
