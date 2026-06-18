'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FaStar, FaArrowRight, FaClock, FaMapMarkerAlt } from 'react-icons/fa';
import { api } from '../lib/api';
import '../styles/FeaturedActivities.css';

const CAT_LABEL = {
  snorkeling: 'Snorkeling', scuba_diving: 'Scuba Diving', surfing: 'Surfing',
  jet_ski: 'Jet Ski', kayaking: 'Kayaking', whale_watching: 'Whale Watching',
  banana_boat: 'Banana Boat', parasailing: 'Parasailing',
  catamaran_sailing: 'Catamaran Sailing', other: 'Other',
};

function FeaturedActivities() {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.activitiesList()
      .then((res) => setItems((res.activities || []).slice(0, 5)))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading || items.length === 0) return null;

  const [hero, ...rest] = items;

  return (
    <section className="fa-section">
      <div className="fa-shell">
        <div className="fa-head">
          <div>
            <span className="eyebrow">Popular this month</span>
            <h2 className="fa-title">
              Water-sport <em>experiences</em> worth the trip
            </h2>
          </div>
          <Link href="/companies" className="fa-see-all">
            Browse all companies <FaArrowRight />
          </Link>
        </div>

        <div className="fa-grid">
          {/* Hero card on the left */}
          <Link href={`/activities/detail?id=${hero.id}`} className="fa-card fa-card-hero">
            <div className="fa-img" style={{ backgroundImage: `url(${hero.image_url})` }} />
            <div className="fa-overlay" />
            <div className="fa-card-body">
              <span className="fa-cat">{CAT_LABEL[hero.category] || hero.category}</span>
              <h3>{hero.name}</h3>
              <div className="fa-meta">
                <span><FaMapMarkerAlt /> {hero.city}</span>
                <span><FaClock /> {hero.duration_min} min</span>
                <span><FaStar /> {hero.user_rating}</span>
              </div>
              <div className="fa-price-row">
                <div>
                  <span className="fa-from">from</span>
                  <strong>INR {Number(hero.from_price || 0).toLocaleString()}</strong>
                  <span className="fa-pp"> / person</span>
                </div>
                <span className="fa-arrow"><FaArrowRight /></span>
              </div>
            </div>
          </Link>

          <div className="fa-side">
            {rest.slice(0, 4).map((a) => (
              <Link key={a.id} href={`/activities/detail?id=${a.id}`} className="fa-card fa-card-small">
                <div className="fa-img-sm" style={{ backgroundImage: `url(${a.image_url})` }} />
                <div className="fa-card-sm-body">
                  <span className="fa-cat-sm">{CAT_LABEL[a.category] || a.category}</span>
                  <h4>{a.name}</h4>
                  <div className="fa-meta-sm">
                    <FaMapMarkerAlt /> {a.city} · <FaStar /> {a.user_rating}
                  </div>
                  <div className="fa-price-sm">
                    <span>from</span>
                    <strong>INR {Number(a.from_price || 0).toLocaleString()}</strong>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default FeaturedActivities;
