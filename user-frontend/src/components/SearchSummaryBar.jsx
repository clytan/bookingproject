'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  FaHotel, FaWater, FaMapMarkerAlt, FaCalendarAlt,
  FaUsers, FaSearch, FaSlidersH, FaChevronDown,
} from 'react-icons/fa';
import '../styles/SearchSummary.css';

const ACTIVITY_CATEGORIES = [
  { value: '',                  label: 'Any activity' },
  { value: 'snorkeling',        label: 'Snorkeling' },
  { value: 'scuba_diving',      label: 'Scuba Diving' },
  { value: 'surfing',           label: 'Surfing' },
  { value: 'jet_ski',           label: 'Jet Ski' },
  { value: 'kayaking',          label: 'Kayaking' },
  { value: 'whale_watching',    label: 'Whale Watching' },
  { value: 'banana_boat',       label: 'Banana Boat' },
  { value: 'parasailing',       label: 'Parasailing' },
  { value: 'catamaran_sailing', label: 'Catamaran Sailing' },
];
const CAT_LABEL = Object.fromEntries(ACTIVITY_CATEGORIES.map((c) => [c.value, c.label]));

const fmtDate = (s) => {
  if (!s) return '';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
};

/**
 * Compact, editable search summary that lives at the top of hotels
 * and water-activity list pages. Reads the current criteria from the URL,
 * lets the user edit, then submits — updating the URL.
 *
 * Props:
 *   mode: 'hotel' | 'activity'
 */
export default function SearchSummaryBar({ mode = 'hotel' }) {
  const router = useRouter();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);

  const today    = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  const [city, setCity]         = useState(params.get('city') || '');
  const [checkin, setCheckin]   = useState(params.get('checkin')  || '');
  const [checkout, setCheckout] = useState(params.get('checkout') || '');
  const [guests, setGuests]     = useState(Number(params.get('guests') || 2));
  const [category, setCategory] = useState(params.get('category') || '');

  // Keep local state in sync if the URL changes externally
  useEffect(() => {
    setCity(params.get('city') || '');
    setCheckin(params.get('checkin')  || '');
    setCheckout(params.get('checkout') || '');
    setGuests(Number(params.get('guests') || 2));
    setCategory(params.get('category') || '');
  }, [params]);

  const submit = (e) => {
    e?.preventDefault?.();
    const q = new URLSearchParams();
    if (city) q.set('city', city);
    if (mode === 'hotel') {
      if (checkin)  q.set('checkin', checkin);
      if (checkout) q.set('checkout', checkout);
      if (guests)   q.set('guests', String(guests));
    } else {
      if (category) q.set('category', category);
    }
    const dest = mode === 'hotel' ? '/hotels' : '/companies';
    const qs = q.toString();
    router.push(qs ? `${dest}?${qs}` : dest);
    setOpen(false);
  };

  // Pretty summary chips — show "Add X" when empty so users can fill in
  const chips = mode === 'hotel'
    ? [
        { icon: <FaMapMarkerAlt />, label: city || 'Any city',
          empty: !city },
        { icon: <FaCalendarAlt />,
          label: checkin && checkout ? `${fmtDate(checkin)} → ${fmtDate(checkout)}` : 'Add dates',
          empty: !(checkin && checkout) },
        { icon: <FaUsers />,
          label: `${guests} guest${guests > 1 ? 's' : ''}` },
      ]
    : [
        { icon: <FaMapMarkerAlt />, label: city || 'Any city',
          empty: !city },
        { icon: <FaWater />,
          label: category ? (CAT_LABEL[category] || category) : 'Any activity',
          empty: !category },
      ];

  return (
    <div className={`ssb ${open ? 'is-open' : ''}`}>
      <div className="ssb-shell">
        <button
          type="button"
          className="ssb-summary"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
        >
          <span className="ssb-icon-lead">
            {mode === 'hotel' ? <FaHotel /> : <FaWater />}
          </span>
          <span className="ssb-chips">
            {chips.map((c, i) => (
              <span key={i} className={`ssb-chip ${c.empty ? 'is-empty' : ''}`}>
                <span className="ssb-chip-icon">{c.icon}</span>
                <span className="ssb-chip-text">{c.label}</span>
              </span>
            ))}
          </span>
          <span className="ssb-modify">
            <FaSlidersH />
            <span>{open ? 'Close' : 'Modify'}</span>
            <FaChevronDown className={`ssb-caret ${open ? 'is-open' : ''}`} />
          </span>
        </button>

        {open && (
          <form className="ssb-edit" onSubmit={submit}>
            <div className="ssb-field">
              <FaMapMarkerAlt className="ssb-field-icon" />
              <div className="ssb-field-body">
                <label>City</label>
                <input
                  type="text"
                  placeholder="e.g. Goa, Pondicherry"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
            </div>

            {mode === 'hotel' ? (
              <>
                <div className="ssb-field">
                  <FaCalendarAlt className="ssb-field-icon" />
                  <div className="ssb-field-body">
                    <label>Check-in</label>
                    <input
                      type="date"
                      value={checkin}
                      min={today}
                      onChange={(e) => setCheckin(e.target.value)}
                    />
                  </div>
                </div>
                <div className="ssb-field">
                  <FaCalendarAlt className="ssb-field-icon" />
                  <div className="ssb-field-body">
                    <label>Check-out</label>
                    <input
                      type="date"
                      value={checkout}
                      min={checkin || tomorrow}
                      onChange={(e) => setCheckout(e.target.value)}
                    />
                  </div>
                </div>
                <div className="ssb-field">
                  <FaUsers className="ssb-field-icon" />
                  <div className="ssb-field-body">
                    <label>Guests</label>
                    <select
                      value={guests}
                      onChange={(e) => setGuests(Number(e.target.value))}
                    >
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <option key={n} value={n}>{n} guest{n > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            ) : (
              <div className="ssb-field">
                <FaWater className="ssb-field-icon" />
                <div className="ssb-field-body">
                  <label>Activity</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)}>
                    {ACTIVITY_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <button type="submit" className="ssb-apply">
              <FaSearch /> Apply
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
