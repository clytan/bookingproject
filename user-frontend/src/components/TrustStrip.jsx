'use client';

import { useEffect, useState } from 'react';
import { FaWater, FaHotel, FaMapMarkerAlt, FaUsers } from 'react-icons/fa';
import { api } from '../lib/api';
import '../styles/TrustStrip.css';

function TrustStrip() {
  const [stats, setStats] = useState({ activities: 0, hotels: 0, cities: 0 });

  useEffect(() => {
    Promise.all([
      api.activitiesList().catch(() => ({ activities: [] })),
      api.hotelsList().catch(() => ({ hotels: [] })),
    ]).then(([a, h]) => {
      const acts = a.activities || [];
      const hotels = h.hotels || [];
      const cities = new Set([
        ...acts.map((x) => x.city),
        ...hotels.map((x) => x.city),
      ].filter(Boolean));
      setStats({
        activities: acts.length,
        hotels: hotels.length,
        cities: cities.size,
      });
    });
  }, []);

  const items = [
    { icon: <FaWater />,        value: stats.activities, label: 'Water activities' },
    { icon: <FaHotel />,        value: stats.hotels,     label: 'Curated hotels'   },
    { icon: <FaMapMarkerAlt />, value: stats.cities,     label: 'Cities covered'   },
    { icon: <FaUsers />,        value: '10k+',           label: 'Happy travelers'  },
  ];

  return (
    <section className="trust-strip">
      <div className="trust-shell">
        {items.map((it, i) => (
          <div key={i} className="trust-item">
            <div className="trust-icon">{it.icon}</div>
            <div>
              <div className="trust-value">{it.value}</div>
              <div className="trust-label">{it.label}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default TrustStrip;
