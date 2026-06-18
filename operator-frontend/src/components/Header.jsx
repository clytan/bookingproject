'use client';

import { useOperator } from './AuthGuard';
import './Header.css';

export default function Header({ title, subtitle }) {
  const o = useOperator();
  return (
    <header className="m-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {o && (
        <div className="m-hotel-chip">
          <div className="m-chip-avatar">{o.full_name?.[0] || '?'}</div>
          <div className="m-chip-info">
            <span className="m-chip-hotel">{o.full_name}</span>
            <span className="m-chip-name">{o.activity_count ?? 0} activit{(o.activity_count ?? 0) === 1 ? 'y' : 'ies'}</span>
          </div>
        </div>
      )}
    </header>
  );
}
