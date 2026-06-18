'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FaHotel, FaWater, FaMapMarkerAlt, FaCalendarAlt,
  FaSearch, FaUsers,
} from 'react-icons/fa';
import '../styles/SearchBar.css';

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

function HotelForm() {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  const [city, setCity]         = useState('');
  const [checkin, setCheckin]   = useState(today);
  const [checkout, setCheckout] = useState(tomorrow);
  const [guests, setGuests]     = useState(2);

  const onSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams({ city, checkin, checkout, guests });
    router.push(`/hotels?${params.toString()}`);
  };

  return (
    <form className="search-bar" onSubmit={onSubmit}>
      <div className="search-field">
        <FaMapMarkerAlt className="field-icon" />
        <div className="field-content">
          <label>City</label>
          <input type="text" placeholder="e.g. Goa, Pondicherry" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
      </div>

      <div className="search-field">
        <FaCalendarAlt className="field-icon" />
        <div className="field-content">
          <label>Check-in</label>
          <input type="date" value={checkin} min={today} onChange={(e) => setCheckin(e.target.value)} />
        </div>
      </div>

      <div className="search-field">
        <FaCalendarAlt className="field-icon" />
        <div className="field-content">
          <label>Check-out</label>
          <input type="date" value={checkout} min={checkin || today} onChange={(e) => setCheckout(e.target.value)} />
        </div>
      </div>

      <div className="search-field">
        <FaUsers className="field-icon" />
        <div className="field-content">
          <label>Guests</label>
          <select value={guests} onChange={(e) => setGuests(Number(e.target.value))}>
            {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} guest{n > 1 ? 's' : ''}</option>)}
          </select>
        </div>
      </div>

      <button type="submit" className="search-btn"><FaSearch /> Search Hotels</button>
    </form>
  );
}

function ActivityForm() {
  const router = useRouter();
  const [city, setCity]         = useState('');
  const [category, setCategory] = useState('');

  const onSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (city)     params.set('city', city);
    if (category) params.set('category', category);
    const qs = params.toString();
    router.push(`/companies${qs ? `?${qs}` : ''}`);
  };

  return (
    <form className="search-bar" onSubmit={onSubmit}>
      <div className="search-field">
        <FaMapMarkerAlt className="field-icon" />
        <div className="field-content">
          <label>City</label>
          <input type="text" placeholder="e.g. Goa, Andaman" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
      </div>

      <div className="search-field">
        <FaWater className="field-icon" />
        <div className="field-content">
          <label>Activity</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {ACTIVITY_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      </div>

      <button type="submit" className="search-btn"><FaSearch /> Find Companies</button>
    </form>
  );
}

export default function SearchBar() {
  const [tab, setTab] = useState('hotel');

  return (
    <div className="search-wrap">
      <div className="search-tabs">
        <button
          type="button"
          className={`tab ${tab === 'hotel' ? 'active' : ''}`}
          onClick={() => setTab('hotel')}
        >
          <FaHotel /> Hotels
        </button>
        <button
          type="button"
          className={`tab ${tab === 'activity' ? 'active' : ''}`}
          onClick={() => setTab('activity')}
        >
          <FaWater /> Water Sports
        </button>
      </div>

      {tab === 'hotel' ? <HotelForm /> : <ActivityForm />}
    </div>
  );
}
