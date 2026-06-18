'use client';

import { useEffect, useState } from 'react';
import { FaMoneyBillWave, FaBookOpen, FaPercentage, FaHandHoldingUsd } from 'react-icons/fa';
import AuthGuard from '../../components/AuthGuard';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import DateRangeFilter, { defaultRange, RANGE_PRESETS } from '../../components/DateRangeFilter';
import { api } from '../../lib/api';
import '../Dashboard.css';
import './Reports.css';

const inr = (n) => `INR ${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export default function ReportsPage() {
  return (
    <AuthGuard>
      <div className="m-layout">
        <Sidebar />
        <div className="m-main">
          <Header title="Reports" subtitle="Your hotel's earnings and bookings performance" />
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
    api.analytics({ from: range.from, to: range.to })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [range.from, range.to]);

  const rangeLabel = RANGE_PRESETS.find((p) => p.id === range.preset)?.label
    || (range.from && range.to ? `${range.from} → ${range.to}` : 'All time');

  return (
    <div className="m-content">
      <DateRangeFilter value={range} onChange={setRange} />

      {loading && <div className="m-state">Loading…</div>}
      {error   && <div className="m-state error">{error}</div>}

      {!loading && !error && data && (
        <>
          <div className="m-stats">
            <StatTile icon={<FaMoneyBillWave />}   color="green"  label={`Gross revenue · ${rangeLabel}`} value={inr(data.totals.revenue)} />
            <StatTile icon={<FaPercentage />}      color="amber"  label={`COKALO commission (${data.commission_percent}%)`} value={inr(data.totals.admin_share)} />
            <StatTile icon={<FaHandHoldingUsd />}  color="cyan"   label="Your payout" value={inr(data.totals.payout)} />
            <StatTile icon={<FaBookOpen />}        color="violet" label="Bookings" value={Number(data.totals.bookings).toLocaleString()} />
          </div>

          <div className="rep-grid-m">
            <div className="m-card-wrap" style={{ padding: 22 }}>
              <h3 className="rep-h3">Monthly trend</h3>
              <p className="rep-p">Revenue + bookings in selected range, bucketed by month</p>
              <Bars trend={data.trend} />
            </div>

            <div className="m-card-wrap" style={{ padding: 22 }}>
              <h3 className="rep-h3">Source mix</h3>
              <p className="rep-p">Website vs walk-in</p>
              <SourceMix rows={data.by_source} />
            </div>
          </div>

          <div className="m-card-wrap" style={{ padding: 22 }}>
            <h3 className="rep-h3">Revenue by room type</h3>
            <p className="rep-p">Includes your payout per room</p>
            <RoomList rows={data.by_room} />
          </div>
        </>
      )}
    </div>
  );
}

function StatTile({ icon, label, value, color }) {
  return (
    <div className="m-stat">
      <div className={`m-stat-icon ${color}`}>{icon}</div>
      <div>
        <div className="m-stat-label">{label}</div>
        <div className="m-stat-value">{value}</div>
      </div>
    </div>
  );
}

function Bars({ trend }) {
  if (!trend || trend.length === 0) return <div className="m-state" style={{ marginTop: 12 }}>No bookings in this range.</div>;
  const max = Math.max(1, ...trend.map((m) => m.revenue));
  return (
    <div className="bars-m">
      {trend.map((m) => (
        <div key={m.month} className="bar-col-m">
          <div className="bar-wrap-m">
            <div className="bar-fill-m" style={{ height: `${(m.revenue / max) * 100}%` }} />
          </div>
          <div className="bar-amt-m">INR {Math.round(m.revenue / 1000)}k</div>
          <div className="bar-month-m">{m.month}</div>
          <div className="bar-count-m">{m.bookings} bk</div>
        </div>
      ))}
    </div>
  );
}

function SourceMix({ rows }) {
  if (!rows || rows.length === 0) return <div className="m-state" style={{ marginTop: 12 }}>No data in this range.</div>;
  const total = rows.reduce((s, x) => s + x.bookings, 0) || 1;
  return (
    <div className="source-rows-m">
      {rows.map((s) => {
        const pct = Math.round((s.bookings / total) * 100);
        return (
          <div key={s.booking_source} className="src-row">
            <div className="src-label">
              <span className={`pill src-${s.booking_source}`}>{s.booking_source === 'manager' ? 'Walk-in' : 'Website'}</span>
              <span className="src-meta">{s.bookings} bk · {inr(s.revenue)}</span>
            </div>
            <div className="bar-h-m"><div className="bar-h-fill-m" style={{ width: `${pct}%` }} /></div>
            <div className="src-pct">{pct}%</div>
          </div>
        );
      })}
    </div>
  );
}

function RoomList({ rows }) {
  const filtered = (rows || []).filter((r) => r.bookings > 0);
  if (filtered.length === 0) return <div className="m-state" style={{ marginTop: 12 }}>No bookings per room in this range.</div>;
  const max = Math.max(1, ...filtered.map((r) => r.revenue));
  return (
    <div className="room-rev-list">
      {filtered.map((r) => (
        <div key={r.id} className="room-rev-row">
          <div className="room-rev-info">
            <strong>{r.room_type}</strong>
            <span>{r.bookings} bookings · {inr(r.price_per_night)}/night · payout {inr(r.payout)}</span>
          </div>
          <div className="room-rev-bar">
            <div className="room-rev-fill" style={{ width: `${(r.revenue / max) * 100}%` }} />
          </div>
          <div className="room-rev-amt">{inr(r.revenue)}</div>
        </div>
      ))}
    </div>
  );
}
