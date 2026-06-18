'use client';

import { useRouter } from 'next/navigation';
import { FaArrowRight, FaClock } from 'react-icons/fa';
import { useAuth } from '../lib/AuthContext';
import '../styles/PopularRoutes.css';

const routes = [
  { id: 1, from: 'Colombo', to: 'Kandy', price: 850, duration: '3h 30m', trips: 24 },
  { id: 2, from: 'Colombo', to: 'Galle', price: 600, duration: '2h 15m', trips: 18 },
  { id: 3, from: 'Colombo', to: 'Jaffna', price: 1800, duration: '8h 00m', trips: 12 },
  { id: 4, from: 'Kandy', to: 'Nuwara Eliya', price: 450, duration: '2h 00m', trips: 16 },
  { id: 5, from: 'Colombo', to: 'Anuradhapura', price: 1200, duration: '5h 30m', trips: 10 },
  { id: 6, from: 'Galle', to: 'Matara', price: 250, duration: '1h 00m', trips: 30 },
];

function PopularRoutes() {
  const router = useRouter();
  const { user } = useAuth();

  const handleBook = (route) => {
    const target = `/search?from=${encodeURIComponent(route.from)}&to=${encodeURIComponent(route.to)}`;
    if (user) {
      router.push(target);
    } else {
      router.push(`/login?redirect=${encodeURIComponent(target)}`);
    }
  };

  return (
    <section className="popular-routes" id="routes">
      <div className="section-header">
        <h2>Popular Bus Routes</h2>
        <p>Most booked bus routes by travellers this week</p>
      </div>

      <div className="routes-grid">
        {routes.map((route) => (
          <div key={route.id} className="route-card">
            <div className="route-cities">
              <span className="city">{route.from}</span>
              <FaArrowRight className="arrow" />
              <span className="city">{route.to}</span>
            </div>
            <div className="route-meta">
              <span className="duration">
                <FaClock /> {route.duration}
              </span>
              <span className="trips">{route.trips} trips daily</span>
            </div>
            <div className="route-footer">
              <div>
                <span className="price-label">Starting from</span>
                <span className="price">INR {route.price}</span>
              </div>
              <button className="book-btn" onClick={() => handleBook(route)}>
                Book Now
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default PopularRoutes;
