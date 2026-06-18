'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FaStar, FaMapMarkerAlt, FaArrowRight } from 'react-icons/fa';
import { api } from '../lib/api';
import '../styles/FeaturedHotels.css';

function FeaturedHotels() {
  const [hotels, setHotels]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.hotelsList()
      .then((res) => setHotels((res.hotels || []).slice(0, 4)))
      .catch(() => setHotels([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !hotels.length) return null;

  return (
    <section className="fh-section">
      <div className="fh-shell">
        <div className="fh-head">
          <div>
            <span className="eyebrow">Where to stay</span>
            <h2 className="fh-title">
              Boutique <em>stays</em>, handpicked for the coast
            </h2>
          </div>
          <Link href="/hotels" className="fh-see-all">See all hotels <FaArrowRight /></Link>
        </div>

        <div className="fh-grid">
          {hotels.map((h) => (
            <Link key={h.id} href={`/hotels/${h.id}`} className="fh-card">
              <div className="fh-img" style={{ backgroundImage: `url(${h.image_url})` }}>
                <div className="fh-rating"><FaStar /> {h.user_rating}</div>
              </div>
              <div className="fh-body">
                <h3>{h.name}</h3>
                <p className="fh-loc"><FaMapMarkerAlt /> {h.city}</p>
                <div className="fh-foot">
                  <span className="fh-from">from</span>
                  <strong className="fh-price">INR {Number(h.from_price).toLocaleString()}</strong>
                  <span className="fh-per">/ night</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FeaturedHotels;
