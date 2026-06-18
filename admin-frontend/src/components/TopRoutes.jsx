import '../styles/TopRoutes.css';

const topRoutes = [
  { route: 'Colombo → Kandy',         bookings: 482, percent: 92 },
  { route: 'Colombo → Galle',         bookings: 364, percent: 78 },
  { route: 'Colombo → Jaffna',        bookings: 251, percent: 60 },
  { route: 'Kandy → Nuwara Eliya',    bookings: 198, percent: 48 },
  { route: 'Colombo → Anuradhapura',  bookings: 144, percent: 35 },
];

function TopRoutes() {
  return (
    <div className="top-routes-card">
      <div className="card-head">
        <h3>Top Routes This Week</h3>
        <p>By number of bookings</p>
      </div>

      <div className="route-list">
        {topRoutes.map((r, i) => (
          <div key={i} className="route-row">
            <div className="route-info">
              <span className="route-name">{r.route}</span>
              <span className="route-count">{r.bookings} bookings</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${r.percent}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TopRoutes;
