'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';
import { api } from '../lib/api';

const EMPTY = {
  id: 0, name: '', city: '', category: 'snorkeling', address: '', description: '',
  difficulty: 'beginner', duration_min: 60, image_url: '', includes: '',
  is_active: true,
};

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
  { value: 'other',             label: 'Other' },
];
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];

export default function ActivityForm({ initial = EMPTY, title = 'New Activity' }) {
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
      const res = await api.activitySave({ ...f, duration_min: Number(f.duration_min) });
      const id = res.id || f.id;
      router.push(`/activities/${id}/edit?saved=1`);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  return (
    <form className="new-form" onSubmit={submit}>
      <div className="form-section">
        <Link href="/activities" className="back-link"><FaArrowLeft /> Back to activities</Link>
        <h3 style={{ marginTop: 16 }}>{title}</h3>

        <div className="m-form-grid">
          <label className="m-form-field full">
            <span>Activity Name *</span>
            <input value={f.name} onChange={set('name')} placeholder="e.g. Sunset Snorkeling at Grande Island" required />
          </label>
          <label className="m-form-field">
            <span>City *</span>
            <input value={f.city} onChange={set('city')} placeholder="Goa" required />
          </label>
          <label className="m-form-field">
            <span>Category *</span>
            <select value={f.category} onChange={set('category')}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </label>
          <label className="m-form-field">
            <span>Difficulty</span>
            <select value={f.difficulty} onChange={set('difficulty')}>
              {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
          <label className="m-form-field">
            <span>Duration (minutes)</span>
            <input type="number" min="1" value={f.duration_min} onChange={set('duration_min')} />
          </label>
          <label className="m-form-field full">
            <span>Address</span>
            <input value={f.address || ''} onChange={set('address')} placeholder="Vasco da Gama Jetty, Goa" />
          </label>
          <label className="m-form-field full">
            <span>Description</span>
            <textarea rows="3" value={f.description || ''} onChange={set('description')} placeholder="What guests will experience..." />
          </label>
          <label className="m-form-field full">
            <span>Image URL</span>
            <input value={f.image_url || ''} onChange={set('image_url')} placeholder="https://..." />
          </label>
          <label className="m-form-field full">
            <span>Includes (comma separated)</span>
            <input value={f.includes || ''} onChange={set('includes')} placeholder="Gear, Guide, Lunch, Photos" />
          </label>
          <label className="m-form-field">
            <span>Active</span>
            <div className="m-switch">
              <input type="checkbox" id="a-active" checked={!!f.is_active} onChange={set('is_active')} />
              <label htmlFor="a-active">{f.is_active ? 'Visible on website' : 'Hidden'}</label>
            </div>
          </label>
        </div>
      </div>

      {error && <div className="m-state error" style={{ padding: 12 }}>{error}</div>}

      <div className="form-foot">
        <Link href="/activities" className="m-btn-ghost">Cancel</Link>
        <button type="submit" className="m-btn-primary" disabled={saving}>
          {saving ? 'Saving…' : (f.id ? 'Save changes' : 'Create activity')}
        </button>
      </div>
    </form>
  );
}
