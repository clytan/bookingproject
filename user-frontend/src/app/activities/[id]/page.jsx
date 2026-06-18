'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { FaStar, FaMapMarkerAlt, FaUsers, FaClock, FaCheckCircle, FaWater, FaBuilding } from 'react-icons/fa';
import Link from 'next/link';
import Navbar from '../../../components/Navbar.jsx';
import Footer from '../../../components/Footer.jsx';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/AuthContext';
import '../../../styles/HotelDetail.css';

const CAT_LABEL = {
  snorkeling: 'Snorkeling', scuba_diving: 'Scuba Diving', surfing: 'Surfing',
  jet_ski: 'Jet Ski', kayaking: 'Kayaking', whale_watching: 'Whale Watching',
  banana_boat: 'Banana Boat', parasailing: 'Parasailing',
  catamaran_sailing: 'Catamaran Sailing', other: 'Other',
};

function ActivityDetailInner() {
  const { id }   = useParams();
  const router   = useRouter();
  const params   = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate]       = useState(params.get('date') || today);
  const [persons, setPersons] = useState(Number(params.get('persons')) || 2);

  const [data, setData]       = useState(null);
  const [avail, setAvail]     = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [bookingSlot, setBookingSlot] = useState(null);
  const [booking, setBooking] = useState(false);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.activityGet(id)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id || !date) return;
    api.activityAvailability({ activity_id: id, date })
      .then((res) => setAvail(res.slots || {}))
      .catch(() => setAvail({}));
  }, [id, date]);

  const book = async (slot) => {
    if (authLoading) return;
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(`/activities/${id}?date=${date}&persons=${persons}`)}`);
      return;
    }
    setBookingSlot(slot.id); setBooking(true); setError('');
    try {
      const res = await api.activityBook({ slot_id: slot.id, date, persons });
      setSuccess(res.booking);
    } catch (e) {
      setError(e.message);
    } finally {
      setBooking(false);
      setBookingSlot(null);
    }
  };

  if (loading) return <><Navbar /><div style={{ padding: 60, textAlign: 'center' }}>Loading…</div></>;
  if (error && !data) return <><Navbar /><div style={{ padding: 60, textAlign: 'center', color: '#991b1b' }}>{error}</div></>;
  if (!data) return null;

  const { activity, slots } = data;

  if (success) {
    return (
      <>
        <Navbar />
        <div className="booking-success">
          <FaCheckCircle className="success-icon" />
          <h1>Booking confirmed!</h1>
          <p className="success-code">Reference: <strong>{success.booking_code}</strong></p>
          <div className="success-details">
            <Row label="Activity"  value={success.activity} />
            <Row label="City"      value={success.city} />
            <Row label="Slot"      value={success.slot_label} />
            <Row label="Departure" value={String(success.departure_time).slice(0,5)} />
            <Row label="Date"      value={success.date} />
            <Row label="Persons"   value={`${success.persons}`} />
            <Row label="Total"     value={`INR ${Number(success.total_amount).toLocaleString()}`} highlight />
          </div>
          <button className="success-btn" onClick={() => router.push('/')}>Back to home</button>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="hotel-detail">
        <div className="detail-hero" style={{ backgroundImage: `url(${activity.image_url})` }}>
          <div className="detail-hero-fade" />
          <div className="detail-hero-content">
            <div className="detail-stars"><FaWater /> <span style={{ marginLeft: 8 }}>{CAT_LABEL[activity.category] || activity.category}</span></div>
            <h1>{activity.name}</h1>
            <p className="detail-address"><FaMapMarkerAlt /> {activity.address || activity.city}</p>
          </div>
        </div>

        <div className="detail-body">
          <div className="detail-main">
            <section className="detail-section">
              <h2>About this activity</h2>
              <p>{activity.description}</p>
              <p style={{ marginTop: 12, color: '#555' }}>
                <FaClock /> Duration: {activity.duration_min} min · Difficulty: <strong>{activity.difficulty}</strong> · Rating: <FaStar style={{ color: '#d97706' }} /> {activity.user_rating}
              </p>
              {activity.operator_name && activity.operator_id && (
                <p style={{ marginTop: 14, padding: '12px 16px', background: '#f0f9ff', borderRadius: 10 }}>
                  <FaBuilding style={{ color: 'var(--primary)', marginRight: 8 }} />
                  Operated by{' '}
                  <Link href={`/operators/${activity.operator_id}`} style={{ color: 'var(--primary)', fontWeight: 700 }}>
                    {activity.operator_name}
                  </Link>
                  {' '}— see all their activities
                </p>
              )}
            </section>

            {activity.includes && (
              <section className="detail-section">
                <h2>What&apos;s included</h2>
                <ul className="amenity-list">
                  {activity.includes.split(',').map((a, i) => (
                    <li key={i}><FaCheckCircle /> {a.trim()}</li>
                  ))}
                </ul>
              </section>
            )}

            <section className="detail-section">
              <h2>Choose a slot</h2>
              {error && <div className="hotels-state error" style={{ marginBottom: 16 }}>{error}</div>}

              <div className="room-list">
                {slots.map((slot) => {
                  const total = slot.price_per_person * persons;
                  const isBooking = booking && bookingSlot === slot.id;
                  const a = avail[slot.id];
                  const free = a ? a.available : slot.max_persons;
                  const soldOut = a && a.fully_booked;
                  const cantFit = persons > slot.max_persons;
                  return (
                    <div key={slot.id} className="room-card">
                      <div className="room-image" style={{ backgroundImage: `url(${slot.image_url || activity.image_url})` }} />
                      <div className="room-body">
                        <h3>{slot.slot_label}</h3>
                        <p className="room-desc">{slot.description}</p>
                        <div className="room-tags">
                          <span><FaClock /> {String(slot.departure_time).slice(0,5)} · {slot.duration_min} min</span>
                          <span><FaUsers /> Max {slot.max_persons}</span>
                          <span className={`avail-pill ${soldOut ? 'red' : free <= 2 ? 'amber' : 'green'}`}>
                            {soldOut ? 'Sold out' : `${free} left`}
                          </span>
                        </div>
                      </div>
                      <div className="room-action">
                        <div className="room-price">
                          <span className="rp-night">INR {Number(slot.price_per_person).toLocaleString()}<small>/person</small></span>
                          <span className="rp-total">INR {Number(total).toLocaleString()} total · {persons} person{persons > 1 ? 's' : ''}</span>
                        </div>
                        <button
                          className="room-book-btn"
                          onClick={() => book(slot)}
                          disabled={isBooking || soldOut || cantFit}
                        >
                          {isBooking ? 'Booking…' : soldOut ? 'Sold out' : cantFit ? 'Too many' : user ? 'Book Now' : 'Login to Book'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          <aside className="detail-aside">
            <div className="search-box">
              <h3>Your booking</h3>
              <label className="aside-field">
                <span>Date</span>
                <input type="date" value={date} min={today} onChange={(e) => setDate(e.target.value)} />
              </label>
              <label className="aside-field">
                <span>Persons</span>
                <select value={persons} onChange={(e) => setPersons(Number(e.target.value))}>
                  {[1,2,3,4,5,6,7,8,9,10].map((n) => <option key={n} value={n}>{n} person{n > 1 ? 's' : ''}</option>)}
                </select>
              </label>
              <div className="aside-summary">
                <strong>{persons}</strong> person{persons > 1 ? 's' : ''} on <strong>{date}</strong>
              </div>
            </div>
          </aside>
        </div>
      </div>
      <Footer />
    </>
  );
}

function Row({ label, value, highlight }) {
  return (
    <div className={`row ${highlight ? 'highlight' : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function ActivityDetailPage() {
  return (
    <Suspense fallback={<div style={{ padding: 60 }}>Loading…</div>}>
      <ActivityDetailInner />
    </Suspense>
  );
}
