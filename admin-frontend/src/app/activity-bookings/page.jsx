'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '../../components/AuthGuard.jsx';
import Sidebar from '../../components/Sidebar.jsx';
import Header from '../../components/Header.jsx';
import DateRangeFilter, { defaultRange, RANGE_PRESETS } from '../../components/DateRangeFilter.jsx';
import { api } from '../../lib/api';
import '../../styles/Dashboard.css';
import '../../styles/AdminList.css';

const inr = (n) => `INR ${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export default function ActivityBookingsPage() {
  return (
    <AuthGuard>
      <div className="admin-layout">
        <Sidebar />
        <div className="admin-main">
          <Header title="Activity Bookings" subtitle="All water-activity reservations" />
          <Inner />
        </div>
      </div>
    </AuthGuard>
  );
}

function Inner() {
  const [range, setRange]       = useState(defaultRange());
  const [bookings, setBookings] = useState([]);
  const [totals, setTotals]     = useState({ gross: 0, admin_share: 0, payout: 0 });
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    api.adminActivityBookingsList({ from: range.from, to: range.to })
      .then((res) => {
        setBookings(res.bookings || []);
        setTotals(res.totals || { gross: 0, admin_share: 0, payout: 0 });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [range.from, range.to]);

  const rangeLabel = RANGE_PRESETS.find((p) => p.id === range.preset)?.label
    || (range.from && range.to ? `${range.from} → ${range.to}` : 'All time');

  return (
    <div className="dashboard-content">
      <DateRangeFilter value={range} onChange={setRange} />

      <div className="page-toolbar">
        <div className="page-toolbar-info">
          <strong>{bookings.length}</strong> bookings in {rangeLabel.toLowerCase()}
        </div>
      </div>

      {!loading && !error && bookings.length > 0 && (
        <div className="fin-summary">
          <div className="fin-card">
            <span className="fin-label">Gross revenue · {rangeLabel}</span>
            <span className="fin-value">{inr(totals.gross)}</span>
            <span className="fin-sub">Confirmed + completed only</span>
          </div>
          <div className="fin-card share">
            <span className="fin-label">Admin share</span>
            <span className="fin-value">{inr(totals.admin_share)}</span>
            <span className="fin-sub">COKALO commission earned</span>
          </div>
          <div className="fin-card payout">
            <span className="fin-label">Operator payout</span>
            <span className="fin-value">{inr(totals.payout)}</span>
            <span className="fin-sub">Owed to operators</span>
          </div>
        </div>
      )}

      <div className="table-card">
        {loading && <div className="state">Loading bookings…</div>}
        {error   && <div className="state error">{error}</div>}
        {!loading && !error && bookings.length === 0 && <div className="state">No activity bookings in {rangeLabel.toLowerCase()}.</div>}

        {!loading && !error && bookings.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Guest</th>
                  <th>Activity</th>
                  <th>Operator</th>
                  <th>Slot</th>
                  <th>Date</th>
                  <th>Persons</th>
                  <th>Total</th>
                  <th>Comm %</th>
                  <th>Admin share</th>
                  <th>Payout</th>
                  <th>Source</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td className="mono">{b.booking_code}</td>
                    <td>
                      <div className="strong">{b.user_name || '—'}</div>
                      <div className="muted small">{b.user_email || ''}</div>
                    </td>
                    <td>{b.activity_name}<div className="muted small">{b.city}</div></td>
                    <td className="muted small">{b.operator_name || '—'}</td>
                    <td>{b.slot_label}<div className="muted small">{String(b.departure_time).slice(0,5)}</div></td>
                    <td className="muted">{b.activity_date}</td>
                    <td className="muted">{b.persons}</td>
                    <td className="strong">{inr(b.total_amount)}</td>
                    <td className="muted">{Number(b.commission_percent).toFixed(b.commission_percent % 1 === 0 ? 0 : 1)}%</td>
                    <td className="amount-share">{inr(b.admin_share)}</td>
                    <td className="amount-payout">{inr(b.payout_amount)}</td>
                    <td><span className={`pill src-${b.booking_source}`}>{b.booking_source === 'operator' ? 'Walk-in' : 'Website'}</span></td>
                    <td><span className={`status-pill ${b.status}`}>{b.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
