'use client';

import { useEffect, useState } from 'react';
import { FaTicketAlt, FaDollarSign, FaPercentage, FaHandHoldingUsd } from 'react-icons/fa';
import AuthGuard from '../components/AuthGuard.jsx';
import Sidebar from '../components/Sidebar.jsx';
import Header from '../components/Header.jsx';
import StatsCard from '../components/StatsCard.jsx';
import RecentBookings from '../components/RecentBookings.jsx';
import TopRoutes from '../components/TopRoutes.jsx';
import DateRangeFilter, { defaultRange, RANGE_PRESETS } from '../components/DateRangeFilter.jsx';
import { api } from '../lib/api';
import '../styles/Dashboard.css';

const inr = (n) => `INR ${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const compact = (n) => {
  const v = Number(n || 0);
  if (v >= 1_000_000) return `INR ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `INR ${(v / 1_000).toFixed(1)}k`;
  return inr(v);
};

export default function DashboardPage() {
  return (
    <AuthGuard>
      <div className="admin-layout">
        <Sidebar />
        <div className="admin-main">
          <Header />
          <Inner />
        </div>
      </div>
    </AuthGuard>
  );
}

function Inner() {
  const [range, setRange]     = useState(defaultRange());
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    api.adminAnalytics({ from: range.from, to: range.to })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [range.from, range.to]);

  const rangeLabel = RANGE_PRESETS.find((p) => p.id === range.preset)?.label
    || (range.from && range.to ? `${range.from} → ${range.to}` : 'All time');

  const stats = data ? [
    { icon: <FaTicketAlt />,      label: 'Bookings',           value: Number(data.totals.bookings).toLocaleString(), change: rangeLabel, trend: 'up',   color: 'indigo' },
    { icon: <FaDollarSign />,     label: 'Gross revenue',      value: compact(data.totals.revenue),                  change: rangeLabel, trend: 'up',   color: 'green'  },
    { icon: <FaPercentage />,     label: 'Admin share',        value: compact(data.totals.admin_share),              change: rangeLabel, trend: 'up',   color: 'amber'  },
    { icon: <FaHandHoldingUsd />, label: 'Vendor payout',      value: compact(data.totals.payout),                   change: rangeLabel, trend: 'up',   color: 'rose'   },
  ] : [];

  return (
    <div className="dashboard-content">
      <DateRangeFilter value={range} onChange={setRange} />

      {loading && <div className="state">Loading…</div>}
      {error   && <div className="state error">{error}</div>}

      {!loading && !error && data && (
        <>
          <div className="stats-grid">
            {stats.map((s, i) => <StatsCard key={i} {...s} />)}
          </div>

          <div className="content-grid">
            <RecentBookings />
            <TopRoutes />
          </div>
        </>
      )}
    </div>
  );
}
