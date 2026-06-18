'use client';

import { useEffect, useState } from 'react';
import {
  FaMoneyBillWave, FaBookOpen, FaPercentage, FaHandHoldingUsd, FaWater, FaHotel,
} from 'react-icons/fa';
import AuthGuard from '../../components/AuthGuard.jsx';
import Sidebar from '../../components/Sidebar.jsx';
import Header from '../../components/Header.jsx';
import DateRangeFilter, { defaultRange, RANGE_PRESETS } from '../../components/DateRangeFilter.jsx';
import { api } from '../../lib/api';
import '../../styles/Dashboard.css';
import '../../styles/AdminList.css';
import '../../styles/Reports.css';

const inr = (n) => `INR ${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export default function ReportsPage() {
  return (
    <AuthGuard>
      <div className="admin-layout">
        <Sidebar />
        <div className="admin-main">
          <Header title="Reports & Analytics" subtitle="Platform performance across hotels and water activities" />
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

  return (
    <div className="dashboard-content">
      <DateRangeFilter value={range} onChange={setRange} />

      {loading && <div className="state">Loading analytics…</div>}
      {error   && <div className="state error">{error}</div>}

      {!loading && !error && data && (
        <>
          <div className="rep-stats">
            <StatCard icon={<FaMoneyBillWave />}  label={`Gross revenue (${rangeLabel})`} value={inr(data.totals.revenue)}     color="green" />
            <StatCard icon={<FaPercentage />}     label="Admin share (commission)"        value={inr(data.totals.admin_share)} color="indigo" />
            <StatCard icon={<FaHandHoldingUsd />} label="Vendor payout"                   value={inr(data.totals.payout)}      color="amber" />
            <StatCard icon={<FaBookOpen />}       label={`Bookings (${rangeLabel})`}      value={Number(data.totals.bookings).toLocaleString()} color="rose" />
          </div>

          <div className="rep-grid">
            <div className="rep-card">
              <h3>Monthly trend</h3>
              <p>Revenue + bookings in selected range, bucketed by month</p>
              <TrendBars trend={data.monthly_trend} />
            </div>

            <div className="rep-card">
              <h3>Source mix</h3>
              <p>Website bookings vs walk-ins (hotels)</p>
              <SourceMix rows={data.by_source} />
            </div>
          </div>

          <div className="rep-card">
            <h3><FaHotel style={{ marginRight: 8, color: '#0891b2' }} />Top performing hotels</h3>
            <p>By revenue in selected range</p>
            <TopList rows={data.top_hotels} kind="hotel" />
          </div>

          <div className="rep-card">
            <h3><FaWater style={{ marginRight: 8, color: '#0891b2' }} />Top performing activities</h3>
            <p>By revenue in selected range</p>
            <TopList rows={data.top_activities} kind="activity" />
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="rep-stat">
      <div className={`rep-stat-icon ${color}`}>{icon}</div>
      <div>
        <div className="rep-stat-label">{label}</div>
        <div className="rep-stat-value">{value}</div>
      </div>
    </div>
  );
}

function TrendBars({ trend }) {
  if (!trend || trend.length === 0) {
    return <div className="state" style={{ marginTop: 12 }}>No bookings in this range.</div>;
  }
  const maxRev = Math.max(1, ...trend.map((m) => m.revenue));
  return (
    <div className="bars">
      {trend.map((m) => (
        <div key={m.month} className="bar-col">
          <div className="bar-wrap">
            <div className="bar-fill" style={{ height: `${(m.revenue / maxRev) * 100}%` }} title={`INR ${m.revenue.toLocaleString()}`} />
          </div>
          <div className="bar-amt">INR {Math.round(m.revenue / 1000)}k</div>
          <div className="bar-month">{m.month}</div>
          <div className="bar-count">{m.bookings} bk</div>
        </div>
      ))}
    </div>
  );
}

function SourceMix({ rows }) {
  if (!rows || rows.length === 0) {
    return <div className="state" style={{ marginTop: 12 }}>No bookings in this range.</div>;
  }
  const total = rows.reduce((a, b) => a + b.bookings, 0);
  return (
    <div className="source-rows">
      {rows.map((s) => {
        const pct = total > 0 ? Math.round((s.bookings / total) * 100) : 0;
        return (
          <div key={s.booking_source} className="source-row">
            <div className="source-label">
              <span className={`pill src-${s.booking_source}`}>
                {s.booking_source === 'manager' ? 'Walk-in' : 'Website'}
              </span>
              <span className="source-meta">{s.bookings} bookings · {inr(s.revenue)}</span>
            </div>
            <div className="bar-h">
              <div className="bar-h-fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="source-pct">{pct}%</div>
          </div>
        );
      })}
    </div>
  );
}

function TopList({ rows, kind }) {
  const filtered = (rows || []).filter((r) => r.bookings > 0);
  if (filtered.length === 0) {
    return <div className="state" style={{ marginTop: 12 }}>No {kind === 'hotel' ? 'hotels' : 'activities'} with bookings in this range.</div>;
  }
  return (
    <table className="rep-table">
      <thead>
        <tr>
          <th></th>
          <th>{kind === 'hotel' ? 'Hotel' : 'Activity'}</th>
          <th>{kind === 'hotel' ? 'City' : 'Operator'}</th>
          <th>Bookings</th>
          <th>Revenue</th>
          <th>Admin share</th>
        </tr>
      </thead>
      <tbody>
        {filtered.map((r) => (
          <tr key={r.id}>
            <td><div className="thumb" style={{ backgroundImage: `url(${r.image_url})` }} /></td>
            <td className="strong">{r.name}</td>
            <td className="muted">{kind === 'hotel' ? r.city : (r.operator_name || '—')}</td>
            <td>{r.bookings}</td>
            <td className="strong">{inr(r.revenue)}</td>
            <td className="amount-share">{inr(r.admin_share)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
