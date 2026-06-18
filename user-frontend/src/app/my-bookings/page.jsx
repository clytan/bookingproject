'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaCalendar, FaMapMarkerAlt, FaBed, FaUsers } from 'react-icons/fa';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';
import { useAuth } from '../../lib/AuthContext';
import { api } from '../../lib/api';
import '../../styles/MyBookings.css';

export default function MyBookingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login?redirect=/my-bookings');
      return;
    }
    api.myBookings()
      .then((res) => setItems(res.bookings))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  const cancel = async (b) => {
    if (!confirm(`Cancel booking ${b.booking_code}?`)) return;
    try {
      await api.cancelBooking(b.id);
      setItems((arr) => arr.map((x) => x.id === b.id ? { ...x, status: 'cancelled' } : x));
    } catch (e) { alert(e.message); }
  };

  return (
    <>
      <Navbar />
      <div className="mybookings-page">
        <h1>My Bookings</h1>
        <p className="mb-subtitle">Your hotel reservations</p>

        {authLoading || loading ? <div className="mb-state">Loading…</div>
          : error ? <div className="mb-state error">{error}</div>
          : items.length === 0 ? (
            <div className="mb-state">
              You haven&apos;t booked anything yet.
              <Link href="/hotels" className="mb-cta">Browse hotels</Link>
            </div>
          ) : (
            <div className="mb-list">
              {items.map((b) => {
                const canCancel = ['pending','confirmed'].includes(b.status) && new Date(b.check_in) > new Date();
                return (
                  <div key={b.id} className="mb-card">
                    <div className="mb-image" style={{ backgroundImage: `url(${b.image_url})` }} />
                    <div className="mb-info">
                      <div className="mb-top">
                        <div>
                          <Link href={`/hotels/${b.hotel_id}`} className="mb-hotel">{b.hotel_name}</Link>
                          <div className="mb-meta"><FaMapMarkerAlt /> {b.city}</div>
                        </div>
                        <span className={`mb-pill ${b.status}`}>{b.status}</span>
                      </div>

                      <div className="mb-row">
                        <div><FaBed /> {b.room_type}</div>
                        <div><FaCalendar /> {b.check_in} → {b.check_out}</div>
                        <div><FaUsers /> {b.guests} guest{b.guests > 1 ? 's' : ''}</div>
                      </div>

                      <div className="mb-bottom">
                        <div className="mb-code">Ref: <code>{b.booking_code}</code></div>
                        <div className="mb-total">INR {Number(b.total_amount).toLocaleString()} · {b.nights} night{b.nights > 1 ? 's' : ''}</div>
                        {canCancel && <button className="mb-cancel" onClick={() => cancel(b)}>Cancel booking</button>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        }
      </div>
      <Footer />
    </>
  );
}
