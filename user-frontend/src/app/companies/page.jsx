'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FaStar, FaMapMarkerAlt, FaArrowRight, FaBuilding, FaFilter, FaTimes } from 'react-icons/fa';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';
import SearchSummaryBar from '../../components/SearchSummaryBar.jsx';
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

function CompaniesInner() {
  const params       = useSearchParams();
  const initialCat   = params.get('category') || '';
  const initialCity  = params.get('city')     || '';

  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const [cats, setCats]   = useState(new Set(initialCat ? initialCat.split(',') : []));
  const [city, setCity]   = useState(initialCity);
  const [search, setSearch] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    const query = {};
    if (cats.size > 0) query.category = Array.from(cats).join(',');
    if (city)          query.city     = city;
    api.operatorsList(query)
      .then((res) => setData(res.operators))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [cats, city]);

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.trim().toLowerCase();
    return data.filter((o) => o.full_name.toLowerCase().includes(q));
  }, [data, search]);

  const toggleCat = (val) => {
    const n = new Set(cats);
    if (n.has(val)) n.delete(val); else n.add(val);
    setCats(n);
  };

  const resetFilters = () => { setCats(new Set()); setCity(''); setSearch(''); };
  const activeCount  = (cats.size > 0 ? 1 : 0) + (city ? 1 : 0);

  return (
    <>
      <Navbar />
      <SearchSummaryBar mode="activity" />
      <div className="hotels-layout">
        <aside className={`filters-aside ${filtersOpen ? 'open' : ''}`}>
          <div className="filters-head">
            <h3>Filters</h3>
            <div className="filters-head-actions">
              {activeCount > 0 && <button className="clear-link" onClick={resetFilters}>Clear all</button>}
              <button className="close-filters" onClick={() => setFiltersOpen(false)}><FaTimes /></button>
            </div>
          </div>

          <div className="filter-group">
            <h4>City</h4>
            <input
              className="sort-select"
              type="text"
              placeholder="Goa, Pondicherry, Andaman…"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <h4>Activity type</h4>
            <div className="chip-list">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  className={`chip ${cats.has(c.value) ? 'on' : ''}`}
                  onClick={() => toggleCat(c.value)}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <h4>Search company name</h4>
            <input
              className="sort-select"
              type="text"
              placeholder="Type to filter…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </aside>

        <main className="hotels-main">
          <div className="hotels-header">
            <div>
              <h1>
                Water sports companies
                <span className="result-count"> · {filtered.length}</span>
              </h1>
              <p className="hotels-subtitle">Browse operators · click any company to see their activities and build your trip</p>
            </div>
            <button className="mobile-filter-btn" onClick={() => setFiltersOpen(true)}>
              <FaFilter /> Filters {activeCount > 0 && <span className="badge-num">{activeCount}</span>}
            </button>
          </div>

          {loading && <div className="hotels-state">Loading companies…</div>}
          {error   && <div className="hotels-state error">{error}</div>}

          {!loading && !error && filtered.length === 0 && (
            <div className="hotels-state">
              No companies match your filters.
              <button className="clear-inline" onClick={resetFilters}>Clear filters</button>
            </div>
          )}

          <div className="hotels-grid">
            {filtered.map((o) => {
              const linkQuery = new URLSearchParams();
              if (cats.size > 0) linkQuery.set('category', Array.from(cats).join(','));
              if (city)          linkQuery.set('city', city);
              const qs = linkQuery.toString();
              return (
                <Link key={o.id} href={`/operators/detail?id=${o.id}${qs ? `&${qs}` : ''}`} className="hotel-card">
                  <div className="hotel-image" style={{ backgroundImage: `url(${o.cover_image || ''})` }}>
                    <div className="star-badge"><FaBuilding /></div>
                  </div>
                  <div className="hotel-body">
                    <div className="hotel-top">
                      <h3>{o.full_name}</h3>
                      {o.top_rating && <span className="rating-pill"><FaStar /> {o.top_rating}</span>}
                    </div>
                    <p className="hotel-location">
                      <FaMapMarkerAlt /> {o.cities.join(' · ')}
                    </p>
                    <p className="hotel-amenities">
                      {o.categories.map((c) => CAT_LABEL[c] || c).join(' · ')}
                    </p>
                    <p className="hotel-amenities" style={{ fontStyle: 'italic' }}>
                      {o.activity_count} activit{o.activity_count === 1 ? 'y' : 'ies'}
                    </p>
                    <div className="hotel-footer">
                      <div>
                        <span className="from-label">From</span>
                        <span className="from-price">INR {Number(o.from_price || 0).toLocaleString()}</span>
                        <span className="per-night">/ person</span>
                      </div>
                      <span className="view-btn">View <FaArrowRight /></span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}

export default function CompaniesPage() {
  return (
    <Suspense fallback={<div style={{ padding: 60 }}>Loading…</div>}>
      <CompaniesInner />
    </Suspense>
  );
}
