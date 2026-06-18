'use client';

import { useManager } from './AuthGuard';
import './Header.css';

export default function Header({ title, subtitle }) {
  const m = useManager();
  return (
    <header className="m-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {m && (
        <div className="m-hotel-chip">
          <div className="m-chip-avatar" style={m.hotel_image ? { backgroundImage: `url(${m.hotel_image})` } : undefined}>
            {!m.hotel_image && m.hotel_name?.[0]}
          </div>
          <div className="m-chip-info">
            <span className="m-chip-hotel">{m.hotel_name}</span>
            <span className="m-chip-name">{m.full_name}</span>
          </div>
        </div>
      )}
    </header>
  );
}
