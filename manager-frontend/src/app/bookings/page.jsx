'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FaPlus } from 'react-icons/fa';
import AuthGuard from '../../components/AuthGuard';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import DateRangeFilter, { defaultRange, RANGE_PRESETS } from '../../components/DateRangeFilter';
import { api } from '../../lib/api';
import '../Dashboard.css';
import './Bookings.css';

const inr = (n) => `INR ${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export default function BookingsPage() {
  return (
    <AuthGuard>
      <div className="m-layout">
        <Sidebar />
        <div className="m-main">
          <Header title="Bookings" subtitle="All reservations at your property" />
          <Inner />
        </div>
      </div>
    </AuthGuard>
  );
}

function Inner() {
  const [items, setItems]     = useState([]);
  const [totals, setTotals]   = useState({ gross: 0, admin_share: 0, payout: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [status, setStatus]   = useState('');
  const [source, setSource]   = useState('');
  const [range,  setRange]    = useState(defaultRange());

  const load = () => {
    setLoading(true);
    api.bookingsList({ status, from: range.from, to: range.to })
      .then((res) => {
        setItems(res.bookings || []);
        setTotals(res.totals || { gross: 0, admin_share: 0, payout: 0 });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [status, range.from, range.to]);

  const filtered = source ? items.filter((b) => b.booking_source === source) : items;

  const rangeLabel = RANGE_PRESETS.find((p) => p.id === range.preset)?.label
    || (range.from && range.to ? `${range.from} → ${range.to}` : 'All time');

  const updateStatus = async (b, newStatus) => {
    if (!confirm(`Change ${b.booking_code} → ${newStatus}?`)) return;
    try { await api.bookingStatus(b.id, newStatus); load(); }
    catch (e) { alert(e.message); }
  };

  return (
    <div className="m-content">
      <DateRangeFilter value={range} onChange={setRange} />

      {!loading && !error && items.length > 0 && (
        <div className="m-fin">
          <div className="m-fin-card">
            <span className="m-fin-label">Gross revenue · {rangeLabel}</span>
            <span className="m-fin-value">{inr(totals.gross)}</span>
            <span className="m-fin-sub">Confirmed + completed</span>
          </div>
          <div className="m-fin-card share">
            <span className="m-fin-label">COKALO commission</span>
            <span className="m-fin-value">{inr(totals.admin_share)}</span>
            <span className="m-fin-sub">Deducted from gross</span>
          </div>
          <div className="m-fin-card payout">
            <span className="m-fin-label">Your payout</span>
            <span className="m-fin-value">{inr(totals.payout)}</span>
            <span className="m-fin-sub">Net to your account</span>
          </div>
        </div>
      )}

      <div className="filters">
        <div className="filter-group">
          <label>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Source</label>
          <select value={source} onChange={(e) => setSource(e.target.value)}>
            <option value="">All</option>
            <option value="user">Website</option>
            <option value="manager">Walk-in</option>
          </select>
        </div>

        <div style={{ marginLeft: 'auto' }}>
          <Link href="/bookings/new" className="m-btn-primary"><FaPlus /> New Booking</Link>
        </div>
      </div>

      <div className="m-card-wrap">
        {loading && <div className="m-state">Loading bookings…</div>}
        {error && <div className="m-state error">{error}</div>}
        {!loading && !error && filtered.length === 0 && <div className="m-state">No bookings match.</div>}

        {!loading && !error && filtered.length > 0 && (
          <table className="m-table">
            <thead>
              <tr>
                <th>Code</th><th>Guest</th><th>Contact</th><th>Room</th><th>Dates</th>
                <th>Nights</th><th>Guests</th><th>Total</th><th>Commission</th><th>Your payout</th>
                <th>Source</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id}>
                  <td className="mono">{b.booking_code}</td>
                  <td className="strong">{b.guest_label}</td>
                  <td className="muted">{b.contact || '—'}</td>
                  <td>{b.room_type}</td>
                  <td>{b.check_in} → {b.check_out}</td>
                  <td>{b.nights}</td>
                  <td>{b.guests}</td>
                  <td className="strong">{inr(b.total_amount)}</td>
                  <td className="muted">{inr(b.admin_share)}</td>
                  <td className="strong" style={{ color: '#16a34a' }}>{inr(b.payout_amount)}</td>
                  <td><span className={`pill src-${b.booking_source}`}>{b.booking_source === 'manager' ? 'Walk-in' : 'Website'}</span></td>
                  <td><span className={`pill ${b.status}`}>{b.status}</span></td>
                  <td>
                    {b.status !== 'cancelled' && b.status !== 'completed' && (
                      <div className="row-actions">
                        {b.status === 'pending' && (
                          <button className="link confirm" onClick={() => updateStatus(b, 'confirmed')}>Confirm</button>
                        )}
                        <button className="link cancel" onClick={() => updateStatus(b, 'cancelled')}>Cancel</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
