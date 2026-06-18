'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';
import { api } from '../lib/api';
import '../styles/HotelForm.css';

const EMPTY = {
  id: 0, name: '', city: '', operator_id: '', category: 'snorkeling', address: '', description: '',
  difficulty: 'beginner', duration_min: 60, user_rating: 4.0, image_url: '', includes: '',
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
  const [f, setF] = useState({
    ...EMPTY, ...initial,
    operator_id: initial.operator_id ?? '',
    is_active: initial.is_active !== false,
  });
  const [operators, setOperators] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  useEffect(() => {
    api.adminOperatorsList()
      .then((res) => setOperators(res.operators))
      .catch(() => setOperators([]));
  }, []);

  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setF({ ...f, [k]: v });
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      const res = await api.adminActivitySave({
        ...f,
        operator_id:  f.operator_id === '' ? null : Number(f.operator_id),
        duration_min: Number(f.duration_min),
        user_rating:  Number(f.user_rating),
      });
      const id = res.id || f.id;
      router.push(`/activities/edit?id=${id}&saved=1`);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  return (
    <form className="hotel-form" onSubmit={submit}>
      <div className="hf-head">
        <Link href="/activities" className="back-link"><FaArrowLeft /> Back to activities</Link>
        <h2>{title}</h2>
      </div>

      <div className="hf-grid">
        <label className="hf-field full">
          <span>Activity Name *</span>
          <input value={f.name} onChange={set('name')} placeholder="e.g. Grande Island Snorkeling Trip" required />
        </label>

        <label className="hf-field">
          <span>City *</span>
          <input value={f.city} onChange={set('city')} placeholder="Goa" required />
        </label>

        <label className="hf-field">
          <span>Category *</span>
          <select value={f.category} onChange={set('category')}>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </label>

        <label className="hf-field full">
          <span>Operator (water sports company)</span>
          <select value={f.operator_id ?? ''} onChange={set('operator_id')}>
            <option value="">— Unassigned (admin-managed) —</option>
            {operators.map((o) => (
              <option key={o.id} value={o.id}>{o.full_name} ({o.username})</option>
            ))}
          </select>
        </label>

        <label className="hf-field">
          <span>Active</span>
          <div className="hf-switch">
            <input type="checkbox" id="a-active" checked={!!f.is_active} onChange={set('is_active')} />
            <label htmlFor="a-active">{f.is_active ? 'Visible on user site' : 'Hidden'}</label>
          </div>
        </label>

        <label className="hf-field full">
          <span>Address</span>
          <input value={f.address || ''} onChange={set('address')} placeholder="Vasco da Gama Jetty, Goa" />
        </label>

        <label className="hf-field">
          <span>Difficulty</span>
          <select value={f.difficulty} onChange={set('difficulty')}>
            {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </label>

        <label className="hf-field">
          <span>Duration (minutes)</span>
          <input type="number" min="1" value={f.duration_min} onChange={set('duration_min')} />
        </label>

        <label className="hf-field">
          <span>Guest Rating (0–5)</span>
          <input type="number" min="0" max="5" step="0.1" value={f.user_rating} onChange={set('user_rating')} />
        </label>

        <label className="hf-field full">
          <span>Description</span>
          <textarea rows="3" value={f.description || ''} onChange={set('description')} placeholder="Describe the activity, what guests will experience..." />
        </label>

        <label className="hf-field full">
          <span>Image URL</span>
          <input value={f.image_url || ''} onChange={set('image_url')} placeholder="https://..." />
        </label>

        <label className="hf-field full">
          <span>Includes (comma separated)</span>
          <input value={f.includes || ''} onChange={set('includes')} placeholder="Gear, Guide, Lunch, Transfers" />
        </label>
      </div>

      {error && <div className="hf-error">{error}</div>}

      <div className="hf-foot">
        <Link href="/activities" className="hf-btn-ghost">Cancel</Link>
        <button type="submit" className="hf-btn-primary" disabled={saving}>
          {saving ? 'Saving…' : (f.id ? 'Save changes' : 'Create activity')}
        </button>
      </div>
    </form>
  );
}
