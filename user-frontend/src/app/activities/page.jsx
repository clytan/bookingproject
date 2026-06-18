'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FaStar, FaMapMarkerAlt, FaArrowRight, FaWater, FaClock, FaFilter, FaTimes } from 'react-icons/fa';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';
import { api } from '../../lib/api';
import '../../styles/Hotels.css';

const CATEGORIES = [
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
const CAT_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];

const INCLUDES_OPTIONS = [
  'Gear', 'Guide', 'Boat ride', 'Lunch', 'Breakfast', 'Photos',
  'Snorkel gear', 'PADI instructor', 'Life jacket', 'Crew',
];

const SORTS = {
  recommended: 'Recommended',
  price_asc:   'Price: low to high',
  price_desc:  'Price: high to low',
  rating:      'Guest rating',
  duration:    'Shortest first',
};

function ActivitiesInner() {
  const params   = useSearchParams();
  const city     = params.get('city') || '';

  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const [sort, setSort]                       = useState('recommended');
  const [priceMin, setPriceMin]               = useState(0);
  const [priceMax, setPriceMax]               = useState(10000);
  const [cats, setCats]                       = useState(new Set());
  const [diffs, setDiffs]                     = useState(new Set());
  const [includes, setIncludes]               = useState(new Set());
  const [minUserRating, setMinUserRating]     = useState(0);
  const [filtersOpen, setFiltersOpen]         = useState(false);

  useEffect(() => {
    setLoading(true);
    api.activitiesList({ city })
      .then((res) => {
        setData(res.activities);
        const prices = (res.activities || []).map((a) => a.from_price).filter(Boolean);
        if (prices.length) {
          setPriceMin(0);
          setPriceMax(Math.ceil(Math.max(...prices) / 500) * 500);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [city]);

  const filtered = useMemo(() => {
    let out = data.filter((a) => {
      if (a.from_price != null && (a.from_price < priceMin || a.from_price > priceMax)) return false;
      if (cats.size > 0 && !cats.has(a.category)) return false;
      if (diffs.size > 0 && !diffs.has(a.difficulty)) return false;
      if (minUserRating && a.user_rating < minUserRating) return false;
      if (includes.size > 0) {
        const t = (a.includes || '').toLowerCase();
        for (const i of includes) if (!t.includes(i.toLowerCase())) return false;
      }
      return true;
    });
    const sorters = {
      price_asc:  (a, b) => (a.from_price || 0) - (b.from_price || 0),
      price_desc: (a, b) => (b.from_price || 0) - (a.from_price || 0),
      rating:     (a, b) => b.user_rating - a.user_rating,
      duration:   (a, b) => (a.duration_min || 0) - (b.duration_min || 0),
    };
    if (sorters[sort]) out = [...out].sort(sorters[sort]);
    return out;
  }, [data, priceMin, priceMax, cats, diffs, includes, minUserRating, sort]);

  const toggle = (set, value, setter) => {
    const n = new Set(set);
    if (n.has(value)) n.delete(value); else n.add(value);
    setter(n);
  };

  const resetFilters = () => {
    setSort('recommended');
    setCats(new Set());
    setDiffs(new Set());
    setIncludes(new Set());
    setMinUserRating(0);
    const prices = data.map((a) => a.from_price).filter(Boolean);
    setPriceMin(0);
    setPriceMax(prices.length ? Math.ceil(Math.max(...prices) / 500) * 500 : 10000);
  };

  const activeFilterCount =
    (cats.size > 0 ? 1 : 0) + (diffs.size > 0 ? 1 : 0) +
    (includes.size > 0 ? 1 : 0) + (minUserRating ? 1 : 0);

  return (
    <>
      <Navbar />
      <div className="hotels-layout">
        <aside className={`filters-aside ${filtersOpen ? 'open' : ''}`}>
          <div className="filters-head">
            <h3>Filters</h3>
            <div className="filters-head-actions">
              {activeFilterCount > 0 && <button className="clear-link" onClick={resetFilters}>Clear all</button>}
              <button className="close-filters" onClick={() => setFiltersOpen(false)}><FaTimes /></button>
            </div>
          </div>

          <FilterGroup label="Sort by">
            <select className="sort-select" value={sort} onChange={(e) => setSort(e.target.value)}>
              {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </FilterGroup>

          <FilterGroup label="Activity type">
            <div className="chip-list">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  className={`chip ${cats.has(c.value) ? 'on' : ''}`}
                  onClick={() => toggle(cats, c.value, setCats)}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </FilterGroup>

          <FilterGroup label="Difficulty">
            <div className="chip-list">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`chip ${diffs.has(d) ? 'on' : ''}`}
                  onClick={() => toggle(diffs, d, setDiffs)}
                >
                  {d}
                </button>
              ))}
            </div>
          </FilterGroup>

          <FilterGroup label="Price per person (INR)">
            <div className="price-row">
              <input type="number" min="0" step="100" value={priceMin} onChange={(e) => setPriceMin(Number(e.target.value))} />
              <span>—</span>
              <input type="number" min="0" step="100" value={priceMax} onChange={(e) => setPriceMax(Number(e.target.value))} />
            </div>
          </FilterGroup>

          <FilterGroup label="Guest rating">
            <div className="rating-pills">
              {[0, 3.5, 4, 4.5].map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`rating-opt ${minUserRating === r ? 'on' : ''}`}
                  onClick={() => setMinUserRating(r)}
                >
                  {r === 0 ? 'Any' : `${r}+`}
                </button>
              ))}
            </div>
          </FilterGroup>

          <FilterGroup label="Includes">
            <div className="checklist">
              {INCLUDES_OPTIONS.map((i) => (
                <label key={i} className="check">
                  <input type="checkbox" checked={includes.has(i)} onChange={() => toggle(includes, i, setIncludes)} />
                  <span className="check-text">{i}</span>
                </label>
              ))}
            </div>
          </FilterGroup>
        </aside>

        <main className="hotels-main">
          <div className="hotels-header">
            <div>
              <h1>
                {city ? `Activities in ${city}` : 'Water Activities'}
                <span className="result-count"> · {filtered.length} of {data.length}</span>
              </h1>
              <p className="hotels-subtitle">Snorkeling, scuba, surfing, jet ski and more</p>
            </div>
            <button className="mobile-filter-btn" onClick={() => setFiltersOpen(true)}>
              <FaFilter /> Filters {activeFilterCount > 0 && <span className="badge-num">{activeFilterCount}</span>}
            </button>
          </div>

          {loading && <div className="hotels-state">Loading activities…</div>}
          {error   && <div className="hotels-state error">{error}</div>}

          {!loading && !error && filtered.length === 0 && (
            <div className="hotels-state">
              No activities match your filters.
              <button className="clear-inline" onClick={resetFilters}>Clear filters</button>
            </div>
          )}

          <div className="hotels-grid">
            {filtered.map((a) => (
              <Link key={a.id} href={`/activities/${a.id}`} className="hotel-card">
                <div className="hotel-image" style={{ backgroundImage: `url(${a.image_url})` }}>
                  <div className="star-badge"><FaWater /></div>
                </div>
                <div className="hotel-body">
                  <div className="hotel-top">
                    <h3>{a.name}</h3>
                    <span className="rating-pill"><FaStar /> {a.user_rating}</span>
                  </div>
                  <p className="hotel-location">
                    <FaMapMarkerAlt /> {a.city}
                    <span className="prop-pill">{CAT_LABEL[a.category] || a.category}</span>
                  </p>
                  <p className="hotel-amenities">
                    <FaClock style={{ marginRight: 4 }} />
                    {a.duration_min} min · {a.difficulty}
                  </p>
                  {a.operator_name && (
                    <p className="hotel-amenities" style={{ fontStyle: 'italic' }}>
                      by <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{a.operator_name}</span>
                    </p>
                  )}
                  {a.includes && (
                    <p className="hotel-amenities">{a.includes.split(',').slice(0, 4).join(' · ')}</p>
                  )}
                  <div className="hotel-footer">
                    <div>
                      <span className="from-label">From</span>
                      <span className="from-price">INR {Number(a.from_price || 0).toLocaleString()}</span>
                      <span className="per-night">/ person</span>
                    </div>
                    <span className="view-btn">View <FaArrowRight /></span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}

function FilterGroup({ label, children }) {
  return (
    <div className="filter-group">
      <h4>{label}</h4>
      {children}
    </div>
  );
}

export default function ActivitiesPage() {
  return (
    <Suspense fallback={<div style={{ padding: 60 }}>Loading…</div>}>
      <ActivitiesInner />
    </Suspense>
  );
}
