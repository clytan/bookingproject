'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FaStar, FaMapMarkerAlt, FaArrowRight, FaFilter, FaTimes } from 'react-icons/fa';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';
import SearchSummaryBar from '../../components/SearchSummaryBar.jsx';
import { api } from '../../lib/api';
import '../../styles/Hotels.css';

// Common hotel amenities — match against the comma-separated `amenities` string
const AMENITY_OPTIONS = [
  'WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant', 'Bar',
  'Free parking', 'Airport shuttle', 'Breakfast', 'Room service',
  'Beach', 'Lake view', 'Mountain view', 'Sea view', 'Garden',
  'Pet friendly', 'Family rooms', 'Wheelchair access',
  'EV charging', 'Kitchen', 'Laundry', 'Heating', 'AC',
  'Butler', 'Tea factory tours', 'Water sports',
];

// Property types — must match the ENUM in the hotels table
const PROPERTY_TYPES = [
  { value: 'hotel',              label: 'Hotel' },
  { value: 'resort',             label: 'Resort' },
  { value: 'boutique_hotel',     label: 'Boutique Hotel' },
  { value: 'service_apartment',  label: 'Service Apartment' },
  { value: 'apartment',          label: 'Apartment' },
  { value: 'independent_house',  label: 'Independent House' },
  { value: 'villa',              label: 'Villa' },
  { value: 'guest_house',        label: 'Guest House' },
  { value: 'hostel',             label: 'Hostel' },
];
const PROPERTY_LABEL = Object.fromEntries(PROPERTY_TYPES.map((p) => [p.value, p.label]));

const SORTS = {
  recommended: 'Recommended',
  price_asc:   'Price: low to high',
  price_desc:  'Price: high to low',
  rating:      'Guest rating',
  stars:       'Star rating',
};

function HotelsInner() {
  const params   = useSearchParams();
  const city     = params.get('city')     || '';
  const checkin  = params.get('checkin')  || '';
  const checkout = params.get('checkout') || '';
  const guests   = Number(params.get('guests') || 1);

  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  // Filter state
  const [sort, setSort]         = useState('recommended');
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(100000);
  const [stars, setStars]       = useState(new Set());      // Set of 1-5
  const [minUserRating, setMinUserRating] = useState(0);
  const [amenities, setAmenities] = useState(new Set());
  const [propertyTypes, setPropertyTypes] = useState(new Set());
  const [minCapacity, setMinCapacity] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    const fetcher = (city || checkin || checkout)
      ? api.hotelsSearch({ city, checkin, checkout, guests })
      : api.hotelsList();
    fetcher
      .then((res) => {
        setData(res);
        // Initialise price slider from data so the range is sane
        const prices = (res.hotels || []).map((h) => h.from_price).filter(Boolean);
        if (prices.length) {
          setPriceMin(0);
          setPriceMax(Math.ceil(Math.max(...prices) / 1000) * 1000);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [city, checkin, checkout, guests]);

  const allHotels = data?.hotels || [];
  const nights    = data?.criteria?.nights || 1;

  const filtered = useMemo(() => {
    let out = allHotels.filter((h) => {
      if (h.from_price != null) {
        if (h.from_price < priceMin || h.from_price > priceMax) return false;
      }
      if (stars.size > 0 && !stars.has(h.star_rating)) return false;
      if (minUserRating && h.user_rating < minUserRating) return false;
      if (propertyTypes.size > 0 && !propertyTypes.has(h.property_type)) return false;
      if (minCapacity > 0 && h.max_capacity != null && h.max_capacity < minCapacity) return false;
      if (amenities.size > 0) {
        const hAmenities = (h.amenities || '').toLowerCase();
        for (const a of amenities) {
          if (!hAmenities.includes(a.toLowerCase())) return false;
        }
      }
      return true;
    });

    const sorters = {
      price_asc:  (a, b) => (a.from_price || 0) - (b.from_price || 0),
      price_desc: (a, b) => (b.from_price || 0) - (a.from_price || 0),
      rating:     (a, b) => b.user_rating - a.user_rating,
      stars:      (a, b) => b.star_rating - a.star_rating,
    };
    if (sorters[sort]) out = [...out].sort(sorters[sort]);
    return out;
  }, [allHotels, priceMin, priceMax, stars, minUserRating, amenities, propertyTypes, minCapacity, sort]);

  const toggleSet = (set, value, setter) => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value); else next.add(value);
    setter(next);
  };

  const resetFilters = () => {
    setSort('recommended');
    setStars(new Set());
    setMinUserRating(0);
    setAmenities(new Set());
    setPropertyTypes(new Set());
    setMinCapacity(0);
    const prices = allHotels.map((h) => h.from_price).filter(Boolean);
    setPriceMin(0);
    setPriceMax(prices.length ? Math.ceil(Math.max(...prices) / 1000) * 1000 : 100000);
  };

  const activeFilterCount =
    (stars.size > 0 ? 1 : 0) +
    (minUserRating ? 1 : 0) +
    (amenities.size > 0 ? 1 : 0) +
    (propertyTypes.size > 0 ? 1 : 0) +
    (minCapacity > 0 ? 1 : 0);

  return (
    <>
      <Navbar />
      <SearchSummaryBar mode="hotel" />
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

          <FilterGroup label="Property type">
            <div className="chip-list">
              {PROPERTY_TYPES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  className={`chip ${propertyTypes.has(p.value) ? 'on' : ''}`}
                  onClick={() => toggleSet(propertyTypes, p.value, setPropertyTypes)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </FilterGroup>

          <FilterGroup label="Guests">
            <div className="rating-pills">
              {[0, 1, 2, 3, 4, 5, 6].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`rating-opt ${minCapacity === n ? 'on' : ''}`}
                  onClick={() => setMinCapacity(n)}
                >
                  {n === 0 ? 'Any' : `${n}+`}
                </button>
              ))}
            </div>
          </FilterGroup>

          <FilterGroup label="Price per night (INR)">
            <div className="price-row">
              <input type="number" min="0" step="500" value={priceMin} onChange={(e) => setPriceMin(Number(e.target.value))} />
              <span>—</span>
              <input type="number" min="0" step="500" value={priceMax} onChange={(e) => setPriceMax(Number(e.target.value))} />
            </div>
          </FilterGroup>

          <FilterGroup label="Star rating">
            <div className="checklist">
              {[5,4,3,2,1].map((n) => (
                <label key={n} className="check">
                  <input type="checkbox" checked={stars.has(n)} onChange={() => toggleSet(stars, n, setStars)} />
                  <span className="check-text">{'⭐'.repeat(n)} <small>{n} star</small></span>
                </label>
              ))}
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

          <FilterGroup label="Amenities">
            <div className="checklist">
              {AMENITY_OPTIONS.map((a) => (
                <label key={a} className="check">
                  <input type="checkbox" checked={amenities.has(a)} onChange={() => toggleSet(amenities, a, setAmenities)} />
                  <span className="check-text">{a}</span>
                </label>
              ))}
            </div>
          </FilterGroup>
        </aside>

        <main className="hotels-main">
          <div className="hotels-header">
            <div>
              <h1>
                {city ? `Hotels in ${city}` : 'All Hotels'}
                <span className="result-count"> · {filtered.length} of {allHotels.length}</span>
              </h1>
              {(checkin && checkout) && (
                <p className="hotels-subtitle">
                  {checkin} → {checkout} · {nights} night{nights > 1 ? 's' : ''} · {guests} guest{guests > 1 ? 's' : ''}
                </p>
              )}
            </div>
            <button className="mobile-filter-btn" onClick={() => setFiltersOpen(true)}>
              <FaFilter /> Filters {activeFilterCount > 0 && <span className="badge-num">{activeFilterCount}</span>}
            </button>
          </div>

          {loading && <div className="hotels-state">Loading hotels…</div>}
          {error && <div className="hotels-state error">{error}</div>}

          {!loading && !error && filtered.length === 0 && (
            <div className="hotels-state">
              No hotels match your filters.
              <button className="clear-inline" onClick={resetFilters}>Clear filters</button>
            </div>
          )}

          <div className="hotels-grid">
            {filtered.map((h) => (
              <Link key={h.id} href={`/hotels/detail?id=${h.id}${buildQuery({ checkin, checkout, guests }).replace('?', '&')}`} className="hotel-card">
                <div className="hotel-image" style={{ backgroundImage: `url(${h.image_url})` }}>
                  <div className="star-badge">
                    {Array.from({ length: h.star_rating }).map((_, i) => <FaStar key={i} />)}
                  </div>
                </div>
                <div className="hotel-body">
                  <div className="hotel-top">
                    <h3>{h.name}</h3>
                    <span className="rating-pill"><FaStar /> {h.user_rating}</span>
                  </div>
                  <p className="hotel-location">
                    <FaMapMarkerAlt /> {h.city}
                    {h.property_type && (
                      <span className="prop-pill">{PROPERTY_LABEL[h.property_type] || h.property_type}</span>
                    )}
                  </p>
                  {h.amenities && (
                    <p className="hotel-amenities">{h.amenities.split(',').slice(0, 4).join(' · ')}</p>
                  )}
                  <div className="hotel-footer">
                    <div>
                      <span className="from-label">From</span>
                      <span className="from-price">INR {Number(h.from_price).toLocaleString()}</span>
                      <span className="per-night">/ night</span>
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

function buildQuery(obj) {
  const s = new URLSearchParams(
    Object.entries(obj).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  ).toString();
  return s ? `?${s}` : '';
}

export default function HotelsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 60 }}>Loading…</div>}>
      <HotelsInner />
    </Suspense>
  );
}
