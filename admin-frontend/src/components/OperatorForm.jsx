'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';
import { api } from '../lib/api';
import '../styles/HotelForm.css';

const EMPTY = {
  id: 0, username: '', email: '', full_name: '', phone: '',
  password: '', commission_percent: 12, is_active: true,
};

export default function OperatorForm({ initial = EMPTY, title = 'New Operator' }) {
  const router = useRouter();
  const [f, setF] = useState({ ...EMPTY, ...initial, is_active: initial.is_active !== false, password: '' });
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
      // Don't send empty password on edit (keeps existing hash)
      const payload = { ...f, commission_percent: Number(f.commission_percent) };
      if (f.id && !payload.password) delete payload.password;
      await api.adminOperatorSave(payload);
      router.push('/operators');
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  return (
    <form className="hotel-form" onSubmit={submit}>
      <div className="hf-head">
        <Link href="/operators" className="back-link"><FaArrowLeft /> Back to operators</Link>
        <h2>{title}</h2>
      </div>

      <div className="hf-grid">
        <label className="hf-field">
          <span>Username *</span>
          <input value={f.username} onChange={set('username')} placeholder="goa_water_sports" required autoComplete="off" />
        </label>

        <label className="hf-field">
          <span>Email *</span>
          <input type="email" value={f.email} onChange={set('email')} placeholder="contact@example.com" required />
        </label>

        <label className="hf-field full">
          <span>Company / Owner Name *</span>
          <input value={f.full_name} onChange={set('full_name')} placeholder="e.g. Goa Water Sports Pvt Ltd" required />
        </label>

        <label className="hf-field">
          <span>Phone</span>
          <input value={f.phone || ''} onChange={set('phone')} placeholder="+91 99 000 0000" />
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
            placeholder="e.g. 12"
            required
          />
          <small className="hf-hint">COKALO's cut on every booking under this operator.</small>
        </label>

        <label className="hf-field">
          <span>Active</span>
          <div className="hf-switch">
            <input type="checkbox" id="o-active" checked={!!f.is_active} onChange={set('is_active')} />
            <label htmlFor="o-active">{f.is_active ? 'Can log in' : 'Disabled'}</label>
          </div>
        </label>

        <label className="hf-field full">
          <span>{f.id ? 'New password (leave blank to keep current)' : 'Password *'}</span>
          <input
            type="password"
            value={f.password}
            onChange={set('password')}
            placeholder={f.id ? 'Leave blank to keep current' : 'Min 6 characters'}
            autoComplete="new-password"
          />
        </label>
      </div>

      {error && <div className="hf-error">{error}</div>}

      <div className="hf-foot">
        <Link href="/operators" className="hf-btn-ghost">Cancel</Link>
        <button type="submit" className="hf-btn-primary" disabled={saving}>
          {saving ? 'Saving…' : (f.id ? 'Save changes' : 'Create operator')}
        </button>
      </div>
    </form>
  );
}
