'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { FaStar, FaMapMarkerAlt, FaUsers, FaBed, FaCheckCircle } from 'react-icons/fa';
import Navbar from '../../../components/Navbar.jsx';
import Footer from '../../../components/Footer.jsx';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/AuthContext';
import '../../../styles/HotelDetail.css';

function HotelDetailInner() {
  const { id }  = useParams();
  const router  = useRouter();
  const params  = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const today    = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  const [checkin, setCheckin]   = useState(params.get('checkin')  || today);
  const [checkout, setCheckout] = useState(params.get('checkout') || tomorrow);
  const [guests, setGuests]     = useState(Number(params.get('guests')) || 2);
  const [bookingRoom, setBookingRoom] = useState(null);
  const [booking, setBooking]   = useState(false);
  const [success, setSuccess]   = useState(null);
  const [error, setError]       = useState('');

  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [avail, setAvail]     = useState({});

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.hotelGet(id)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id || !checkin || !checkout) return;
    if (new Date(checkout) <= new Date(checkin)) return;
    api.hotelAvailability({ hotel_id: id, checkin, checkout })
      .then((res) => setAvail(res.rooms || {}))
      .catch(() => setAvail({}));
  }, [id, checkin, checkout]);

  const nights = nightsBetween(checkin, checkout);

  const handleBook = async (room) => {
    if (authLoading) return;
    if (!user) {
      const back = `/hotels/${id}?checkin=${checkin}&checkout=${checkout}&guests=${guests}`;
      router.push(`/login?redirect=${encodeURIComponent(back)}`);
      return;
    }
    if (nights < 1) { setError('Pick a check-out date after check-in'); return; }
    if (guests > room.capacity) { setError(`That room fits only ${room.capacity} guest(s)`); return; }

    setBookingRoom(room.id);
    setBooking(true);
    setError('');
    try {
      const res = await api.hotelBook({
        room_id:   room.id,
        check_in:  checkin,
        check_out: checkout,
        guests,
      });
      setSuccess(res.booking);
    } catch (e) {
      setError(e.message);
    } finally {
      setBooking(false);
      setBookingRoom(null);
    }
  };

  if (loading) return <><Navbar /><div style={{ padding: 60, textAlign: 'center' }}>Loading…</div></>;
  if (error && !data) return <><Navbar /><div style={{ padding: 60, textAlign: 'center', color: '#991b1b' }}>{error}</div></>;
  if (!data) return null;

  const { hotel, rooms } = data;

  if (success) {
    return (
      <>
        <Navbar />
        <div className="booking-success">
          <FaCheckCircle className="success-icon" />
          <h1>Booking confirmed!</h1>
          <p className="success-code">Reference: <strong>{success.booking_code}</strong></p>
          <div className="success-details">
            <Row label="Hotel"     value={success.hotel} />
            <Row label="Room"      value={success.room_type} />
            <Row label="Check-in"  value={success.check_in} />
            <Row label="Check-out" value={success.check_out} />
            <Row label="Nights"    value={`${success.nights}`} />
            <Row label="Guests"    value={`${success.guests}`} />
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
        <div className="detail-hero" style={{ backgroundImage: `url(${hotel.image_url})` }}>
          <div className="detail-hero-fade" />
          <div className="detail-hero-content">
            <div className="detail-stars">
              {Array.from({ length: hotel.star_rating }).map((_, i) => <FaStar key={i} />)}
            </div>
            <h1>{hotel.name}</h1>
            <p className="detail-address"><FaMapMarkerAlt /> {hotel.address || hotel.city}</p>
          </div>
        </div>

        <div className="detail-body">
          <div className="detail-main">
            <section className="detail-section">
              <h2>About this hotel</h2>
              <p>{hotel.description}</p>
            </section>

            {hotel.amenities && (
              <section className="detail-section">
                <h2>Amenities</h2>
                <ul className="amenity-list">
                  {hotel.amenities.split(',').map((a, i) => (
                    <li key={i}><FaCheckCircle /> {a.trim()}</li>
                  ))}
                </ul>
              </section>
            )}

            <section className="detail-section">
              <h2>Choose a room</h2>
              {error && <div className="hotels-state error" style={{ marginBottom: 16 }}>{error}</div>}

              <div className="room-list">
                {rooms.map((room) => {
                  const total = room.price_per_night * nights;
                  const isBooking = booking && bookingRoom === room.id;
                  const a = avail[room.id];
                  const free = a ? a.available : room.total_rooms;
                  const soldOut = a && a.fully_booked;
                  return (
                    <div key={room.id} className="room-card">
                      <div className="room-image" style={{ backgroundImage: `url(${room.image_url})` }} />
                      <div className="room-body">
                        <h3>{room.room_type}</h3>
                        <p className="room-desc">{room.description}</p>
                        <div className="room-tags">
                          <span><FaUsers /> Up to {room.capacity}</span>
                          <span><FaBed /> {room.amenities?.split(',')[0] || 'Comfort'}</span>
                          <span className={`avail-pill ${soldOut ? 'red' : free <= 2 ? 'amber' : 'green'}`}>
                            {soldOut ? 'Sold out' : `${free} left`}
                          </span>
                        </div>
                      </div>
                      <div className="room-action">
                        <div className="room-price">
                          <span className="rp-night">INR {Number(room.price_per_night).toLocaleString()}<small>/night</small></span>
                          <span className="rp-total">INR {Number(total).toLocaleString()} total · {nights} night{nights > 1 ? 's' : ''}</span>
                        </div>
                        <button
                          className="room-book-btn"
                          onClick={() => handleBook(room)}
                          disabled={isBooking || soldOut}
                        >
                          {isBooking ? 'Booking…' : soldOut ? 'Sold out' : user ? 'Book Now' : 'Login to Book'}
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
              <h3>Your stay</h3>
              <label className="aside-field">
                <span>Check-in</span>
                <input type="date" value={checkin} min={today} onChange={(e) => setCheckin(e.target.value)} />
              </label>
              <label className="aside-field">
                <span>Check-out</span>
                <input type="date" value={checkout} min={checkin || today} onChange={(e) => setCheckout(e.target.value)} />
              </label>
              <label className="aside-field">
                <span>Guests</span>
                <select value={guests} onChange={(e) => setGuests(Number(e.target.value))}>
                  {[1,2,3,4,5,6].map((n) => <option key={n} value={n}>{n} guest{n>1?'s':''}</option>)}
                </select>
              </label>
              <div className="aside-summary">
                <strong>{nights}</strong> night{nights > 1 ? 's' : ''} · <strong>{guests}</strong> guest{guests > 1 ? 's' : ''}
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

function nightsBetween(a, b) {
  try {
    const d1 = new Date(a);
    const d2 = new Date(b);
    return Math.max(1, Math.round((d2 - d1) / 86400000));
  } catch { return 1; }
}

export default function HotelDetailPage() {
  return (
    <Suspense fallback={<div style={{ padding: 60 }}>Loading…</div>}>
      <HotelDetailInner />
    </Suspense>
  );
}
