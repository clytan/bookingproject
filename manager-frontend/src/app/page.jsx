'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FaSignInAlt, FaSignOutAlt, FaUsers, FaMoneyBillWave, FaBookOpen,
  FaPlus, FaArrowRight, FaPercentage, FaHandHoldingUsd,
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
        <Header title="Dashboard" subtitle="Today at a glance + earnings for any range" />
        <Inner />
      </div>
    </div>
  );
}

function Inner() {
  const [data, setData]       = useState(null);
  const [analytics, setAnalytics] = useState(null);
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
    api.analytics({ from: range.from, to: range.to })
      .then(setAnalytics)
      .catch(() => {});
  }, [range.from, range.to]);

  if (loading) return <div className="m-content"><div className="m-state">Loading…</div></div>;
  if (error)   return <div className="m-content"><div className="m-state error">{error}</div></div>;

  const s = data.stats;
  const rangeLabel = RANGE_PRESETS.find((p) => p.id === range.preset)?.label
    || (range.from && range.to ? `${range.from} → ${range.to}` : 'All time');

  const todayCards = [
    { icon: <FaSignInAlt />,    label: "Today's Check-ins",  value: s.today_checkins,                 color: 'cyan'   },
    { icon: <FaSignOutAlt />,   label: "Today's Check-outs", value: s.today_checkouts,                color: 'violet' },
    { icon: <FaUsers />,        label: 'Guests in House',    value: s.current_guests,                 color: 'green'  },
    { icon: <FaBookOpen />,     label: 'Bookings this Month',value: s.month_bookings,                 color: 'amber'  },
    { icon: <FaMoneyBillWave />,label: 'Revenue this Month', value: inr(s.month_revenue),             color: 'rose'   },
  ];

  return (
    <div className="m-content">
      <DateRangeFilter value={range} onChange={setRange} />

      {analytics && (
        <div className="m-fin">
          <div className="m-fin-card">
            <span className="m-fin-label">Gross revenue · {rangeLabel}</span>
            <span className="m-fin-value">{inr(analytics.totals.revenue)}</span>
            <span className="m-fin-sub">{analytics.totals.bookings} bookings</span>
          </div>
          <div className="m-fin-card share">
            <span className="m-fin-label">COKALO commission ({analytics.commission_percent}%)</span>
            <span className="m-fin-value">{inr(analytics.totals.admin_share)}</span>
            <span className="m-fin-sub">Deducted from gross</span>
          </div>
          <div className="m-fin-card payout">
            <span className="m-fin-label">Your payout</span>
            <span className="m-fin-value">{inr(analytics.totals.payout)}</span>
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
            <p>Next 6 reservations across all room types</p>
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
                <th>Code</th><th>Guest</th><th>Room</th><th>Check-in</th><th>Check-out</th><th>Guests</th><th>Total</th><th>Source</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.upcoming.map((b) => (
                <tr key={b.id}>
                  <td className="mono">{b.booking_code}</td>
                  <td className="strong">{b.guest}</td>
                  <td>{b.room_type}</td>
                  <td>{b.check_in}</td>
                  <td>{b.check_out}</td>
                  <td>{b.guests}</td>
                  <td className="strong">{inr(b.total_amount)}</td>
                  <td><span className={`pill src-${b.booking_source}`}>{b.booking_source === 'manager' ? 'Walk-in' : 'Website'}</span></td>
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
