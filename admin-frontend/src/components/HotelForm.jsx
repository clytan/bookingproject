'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';
import { api } from '../lib/api';
import '../styles/HotelForm.css';

const EMPTY = {
  id: 0, name: '', city: '', property_type: 'hotel', address: '', description: '',
  star_rating: 3, user_rating: 4.0, image_url: '', amenities: '',
  commission_percent: 15,
  is_active: true,
};

const PROPERTY_TYPE_OPTIONS = [
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

export default function HotelForm({ initial = EMPTY, title = 'New Hotel' }) {
  const router = useRouter();
  const [f, setF] = useState({ ...EMPTY, ...initial, is_active: initial.is_active !== false });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setF({ ...f, [k]: v });
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      const res = await api.adminHotelSave({
        ...f,
        star_rating:        Number(f.star_rating),
        user_rating:        Number(f.user_rating),
        commission_percent: Number(f.commission_percent),
      });
      const id = res.id || f.id;
      router.push(`/hotels/${id}/edit?saved=1`);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  return (
    <form className="hotel-form" onSubmit={submit}>
      <div className="hf-head">
        <Link href="/hotels" className="back-link"><FaArrowLeft /> Back to hotels</Link>
        <h2>{title}</h2>
      </div>

      <div className="hf-grid">
        <label className="hf-field full">
          <span>Hotel Name *</span>
          <input value={f.name} onChange={set('name')} placeholder="e.g. Cinnamon Grand Colombo" required />
        </label>

        <label className="hf-field">
          <span>City *</span>
          <input value={f.city} onChange={set('city')} placeholder="Colombo" required />
        </label>

        <label className="hf-field">
          <span>Property Type *</span>
          <select value={f.property_type || 'hotel'} onChange={set('property_type')}>
            {PROPERTY_TYPE_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </label>

        <label className="hf-field">
          <span>Active</span>
          <div className="hf-switch">
            <input type="checkbox" id="h-active" checked={!!f.is_active} onChange={set('is_active')} />
            <label htmlFor="h-active">{f.is_active ? 'Visible on user site' : 'Hidden'}</label>
          </div>
        </label>

        <label className="hf-field full">
          <span>Address</span>
          <input value={f.address || ''} onChange={set('address')} placeholder="77 Galle Road, Colombo 03" />
        </label>

        <label className="hf-field">
          <span>Star Rating</span>
          <select value={f.star_rating} onChange={set('star_rating')}>
            {[1,2,3,4,5].map((n) => <option key={n} value={n}>{n} star</option>)}
          </select>
        </label>

        <label className="hf-field">
          <span>Guest Rating (0–5)</span>
          <input type="number" min="0" max="5" step="0.1" value={f.user_rating} onChange={set('user_rating')} />
        </label>

        <label className="hf-field">
          <span>Commission % *</span>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={f.commission_percent}
            onChange={set('commission_percent')}
            placeholder="e.g. 15"
            required
          />
          <small className="hf-hint">COKALO's cut on every booking at this property.</small>
        </label>

        <label className="hf-field full">
          <span>Description</span>
          <textarea rows="3" value={f.description || ''} onChange={set('description')} placeholder="Describe your hotel..." />
        </label>

        <label className="hf-field full">
          <span>Image URL</span>
          <input value={f.image_url || ''} onChange={set('image_url')} placeholder="https://..." />
        </label>

        <label className="hf-field full">
          <span>Amenities (comma separated)</span>
          <input value={f.amenities || ''} onChange={set('amenities')} placeholder="WiFi, Pool, Spa, Restaurant" />
        </label>
      </div>

      {error && <div className="hf-error">{error}</div>}

      <div className="hf-foot">
        <Link href="/hotels" className="hf-btn-ghost">Cancel</Link>
        <button type="submit" className="hf-btn-primary" disabled={saving}>
          {saving ? 'Saving…' : (f.id ? 'Save changes' : 'Create hotel')}
        </button>
      </div>
    </form>
  );
}
