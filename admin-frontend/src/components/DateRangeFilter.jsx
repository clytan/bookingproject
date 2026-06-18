'use client';

import { useState } from 'react';
import { FaCalendarAlt } from 'react-icons/fa';
import '../styles/DateRangeFilter.css';

const iso = (d) => d.toISOString().slice(0, 10);

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return iso(d);
}
function startOfWeek() {
  // ISO week — Monday as the start
  const d = new Date();
  const day = (d.getDay() + 6) % 7; // 0 = Monday
  d.setDate(d.getDate() - day);
  return iso(d);
}
function startOfMonth() {
  const d = new Date();
  return iso(new Date(d.getFullYear(), d.getMonth(), 1));
}
function startOfYear() {
  const d = new Date();
  return iso(new Date(d.getFullYear(), 0, 1));
}

export const RANGE_PRESETS = [
  { id: 'wtd',   label: 'This week',    build: () => ({ from: startOfWeek(),   to: iso(new Date()) }) },
  { id: '7d',    label: 'Last 7 days',  build: () => ({ from: daysAgo(6),      to: iso(new Date()) }) },
  { id: '30d',   label: 'Last 30 days', build: () => ({ from: daysAgo(29),     to: iso(new Date()) }) },
  { id: '90d',   label: 'Last 90 days', build: () => ({ from: daysAgo(89),     to: iso(new Date()) }) },
  { id: 'mtd',   label: 'This month',   build: () => ({ from: startOfMonth(),  to: iso(new Date()) }) },
  { id: 'ytd',   label: 'This year',    build: () => ({ from: startOfYear(),   to: iso(new Date()) }) },
  { id: 'all',   label: 'All time',     build: () => ({ from: '',              to: '' }) },
];

export const defaultRange = () => ({ ...RANGE_PRESETS[1].build(), preset: '30d' });

/**
 * Compact, inline date-range filter.
 * Controlled: parent owns `value` ({from, to, preset}) and updates via `onChange`.
 */
export default function DateRangeFilter({ value, onChange }) {
  const [customOpen, setCustomOpen] = useState(value.preset === 'custom');

  const pickPreset = (p) => {
    setCustomOpen(false);
    onChange({ ...p.build(), preset: p.id });
  };

  const setField = (k) => (e) => {
    onChange({ ...value, [k]: e.target.value, preset: 'custom' });
  };

  return (
    <div className="drf">
      <div className="drf-chips">
        {RANGE_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`drf-chip ${value.preset === p.id ? 'on' : ''}`}
            onClick={() => pickPreset(p)}
          >
            {p.label}
          </button>
        ))}
        <button
          type="button"
          className={`drf-chip ${value.preset === 'custom' ? 'on' : ''}`}
          onClick={() => setCustomOpen((o) => !o)}
        >
          <FaCalendarAlt /> Custom
        </button>
      </div>

      {(customOpen || value.preset === 'custom') && (
        <div className="drf-custom">
          <label className="drf-field">
            <span>From</span>
            <input type="date" value={value.from} onChange={setField('from')} />
          </label>
          <label className="drf-field">
            <span>To</span>
            <input type="date" value={value.to} onChange={setField('to')} min={value.from || undefined} />
          </label>
        </div>
      )}
    </div>
  );
}
