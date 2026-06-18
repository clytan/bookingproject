'use client';

import { useEffect, useState } from 'react';
import { FaCheck } from 'react-icons/fa';
import AuthGuard from '../../components/AuthGuard';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { api } from '../../lib/api';
import '../Dashboard.css';
import '../rooms/Rooms.css';
import './Profile.css';

export default function ProfilePage() {
  return (
    <AuthGuard>
      <div className="m-layout">
        <Sidebar />
        <div className="m-main">
          <Header title="Hotel Profile" subtitle="Update what guests see on the website" />
          <Inner />
        </div>
      </div>
    </AuthGuard>
  );
}

function Inner() {
  const [f, setF]             = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [saved, setSaved]     = useState(false);

  useEffect(() => {
    api.hotelGet()
      .then((res) => setF(res.hotel))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setSaved(false); setSaving(true);
    try {
      await api.hotelSave({
        name: f.name, city: f.city, address: f.address || '',
        description: f.description || '', image_url: f.image_url || '',
        amenities: f.amenities || '',
      });
      setSaved(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="m-content"><div className="m-state">Loading…</div></div>;
  if (!f)      return <div className="m-content"><div className="m-state error">{error}</div></div>;

  return (
    <div className="m-content">
      {saved && <div className="save-banner-m"><FaCheck /> Profile updated</div>}

      <form className="profile-form" onSubmit={submit}>
        <div className="prof-cover" style={f.image_url ? { backgroundImage: `url(${f.image_url})` } : undefined}>
          <div className="prof-cover-fade" />
          <div className="prof-cover-text">
            <div className="prof-stars">{'⭐'.repeat(f.star_rating)}</div>
            <h2>{f.name}</h2>
            <p>{f.city}</p>
          </div>
        </div>

        <div className="prof-body">
          <h3>Basic info</h3>
          <div className="m-form-grid">
            <label className="m-form-field">
              <span>Hotel Name *</span>
              <input value={f.name} onChange={set('name')} required />
            </label>
            <label className="m-form-field">
              <span>City *</span>
              <input value={f.city} onChange={set('city')} required />
            </label>
            <label className="m-form-field full">
              <span>Address</span>
              <input value={f.address || ''} onChange={set('address')} />
            </label>
            <label className="m-form-field full">
              <span>Description</span>
              <textarea rows="4" value={f.description || ''} onChange={set('description')} placeholder="What makes your property special?" />
            </label>
            <label className="m-form-field full">
              <span>Cover Image URL</span>
              <input value={f.image_url || ''} onChange={set('image_url')} placeholder="https://..." />
            </label>
            <label className="m-form-field full">
              <span>Amenities (comma separated)</span>
              <input value={f.amenities || ''} onChange={set('amenities')} placeholder="WiFi, Pool, Spa, Restaurant, Beach access" />
            </label>
          </div>

          <div className="readonly-note">
            <strong>Star rating</strong> ({f.star_rating}-star) and <strong>guest rating</strong> ({f.user_rating}) are managed by the admin team.
          </div>

          {error && <div className="m-state error" style={{ padding: 12 }}>{error}</div>}

          <div className="prof-foot">
            <button type="submit" className="m-btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
