'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FaCalendarDay, FaUsers, FaMoneyBillWave, FaPlus, FaArrowRight, FaCalendarAlt, FaList,
} from 'react-icons/fa';
import AuthGuard from '../components/AuthGuard';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import DateRangeFilter, { defaultRange, RANGE_PRESETS } from '../components/DateRangeFilter';
import { api } from '../lib/api';
import './Dashboard.css';

const inr = (n) => `INR ${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export default function DashboardPage() {
  return (
    <AuthGuard>
      <Layout />
    </AuthGuard>
  );
}

function Layout() {
  return (
    <div className="m-layout">
      <Sidebar />
      <div className="m-main">
        <Header title="Dashboard" subtitle="Today's snapshot + earnings for any range" />
        <Inner />
      </div>
    </div>
  );
}

function Inner() {
  const [data, setData]       = useState(null);
  const [earnings, setEarn]   = useState(null);
  const [range, setRange]     = useState(defaultRange());
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    api.stats()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    api.bookingsList({ from: range.from, to: range.to })
      .then(setEarn)
      .catch(() => {});
  }, [range.from, range.to]);

  if (loading) return <div className="m-content"><div className="m-state">Loading…</div></div>;
  if (error)   return <div className="m-content"><div className="m-state error">{error}</div></div>;

  const s = data.stats;
  const rangeLabel = RANGE_PRESETS.find((p) => p.id === range.preset)?.label
    || (range.from && range.to ? `${range.from} → ${range.to}` : 'All time');

  const todayCards = [
    { icon: <FaList />,         label: 'My Activities',       value: s.activity_count,      color: 'cyan'   },
    { icon: <FaCalendarDay />,  label: "Today's Bookings",    value: s.today_bookings,      color: 'violet' },
    { icon: <FaUsers />,        label: "Today's Persons",     value: s.today_persons,       color: 'green'  },
    { icon: <FaCalendarAlt />,  label: 'Upcoming Total',      value: s.upcoming_total,      color: 'amber'  },
    { icon: <FaMoneyBillWave />,label: 'Revenue this Month',  value: inr(s.month_revenue),  color: 'rose'   },
  ];

  return (
    <div className="m-content">
      <DateRangeFilter value={range} onChange={setRange} />

      {earnings && (
        <div className="m-fin">
          <div className="m-fin-card">
            <span className="m-fin-label">Gross revenue · {rangeLabel}</span>
            <span className="m-fin-value">{inr(earnings.totals.gross)}</span>
            <span className="m-fin-sub">Confirmed + completed</span>
          </div>
          <div className="m-fin-card share">
            <span className="m-fin-label">COKALO commission ({earnings.commission_percent}%)</span>
            <span className="m-fin-value">{inr(earnings.totals.admin_share)}</span>
            <span className="m-fin-sub">Deducted from gross</span>
          </div>
          <div className="m-fin-card payout">
            <span className="m-fin-label">Your payout</span>
            <span className="m-fin-value">{inr(earnings.totals.payout)}</span>
            <span className="m-fin-sub">Net to your account</span>
          </div>
        </div>
      )}

      <div className="m-stats">
        {todayCards.map((c, i) => (
          <div key={i} className="m-stat">
            <div className={`m-stat-icon ${c.color}`}>{c.icon}</div>
            <div>
              <div className="m-stat-label">{c.label}</div>
              <div className="m-stat-value">{c.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="m-card-wrap">
        <div className="m-card-head">
          <div>
            <h3>Upcoming bookings</h3>
            <p>Next 6 reservations across all slots</p>
          </div>
          <div className="m-card-actions">
            <Link href="/bookings/new" className="m-btn-primary"><FaPlus /> New Booking</Link>
            <Link href="/bookings" className="m-btn-ghost">View all <FaArrowRight /></Link>
          </div>
        </div>

        {data.upcoming.length === 0 ? (
          <div className="m-state">No upcoming bookings.</div>
        ) : (
          <table className="m-table">
            <thead>
              <tr>
                <th>Code</th><th>Guest</th><th>Activity</th><th>Slot</th><th>Date</th><th>Departure</th><th>Persons</th><th>Total</th><th>Source</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.upcoming.map((b) => (
                <tr key={b.id}>
                  <td className="mono">{b.booking_code}</td>
                  <td className="strong">{b.guest}</td>
                  <td>{b.activity_name}<div className="muted small">{b.city}</div></td>
                  <td>{b.slot_label}</td>
                  <td>{b.activity_date}</td>
                  <td>{String(b.departure_time).slice(0,5)}</td>
                  <td>{b.persons}</td>
                  <td className="strong">{inr(b.total_amount)}</td>
                  <td><span className={`pill src-${b.booking_source}`}>{b.booking_source === 'operator' ? 'Walk-in' : 'Website'}</span></td>
                  <td><span className={`pill ${b.status}`}>{b.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
