import { FaEllipsisV } from 'react-icons/fa';
import '../styles/RecentBookings.css';

const bookings = [
  { id: 'BK1042', passenger: 'Kavindu Perera',  route: 'Colombo → Kandy',    date: '2026-05-12', seat: '12A', amount: 850,  status: 'confirmed' },
  { id: 'BK1041', passenger: 'Nimal Silva',     route: 'Galle → Colombo',    date: '2026-05-12', seat: '08B', amount: 600,  status: 'pending' },
  { id: 'BK1040', passenger: 'Anushka Fernando',route: 'Colombo → Jaffna',   date: '2026-05-11', seat: '03C', amount: 1800, status: 'confirmed' },
  { id: 'BK1039', passenger: 'Roshan Bandara',  route: 'Kandy → Nuwara Eliya',date: '2026-05-11', seat: '15A', amount: 450,  status: 'cancelled' },
  { id: 'BK1038', passenger: 'Dilini Rajapaksa',route: 'Colombo → Anuradhapura',date: '2026-05-11', seat: '21D', amount: 1200, status: 'confirmed' },
  { id: 'BK1037', passenger: 'Sahan Wijesinghe',route: 'Galle → Matara',     date: '2026-05-10', seat: '05A', amount: 250,  status: 'confirmed' },
];

function RecentBookings() {
  return (
    <div className="table-card">
      <div className="table-header">
        <div>
          <h3>Recent Bookings</h3>
          <p>Latest 6 bookings across all routes</p>
        </div>
        <button className="view-all">View all</button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>Passenger</th>
              <th>Route</th>
              <th>Date</th>
              <th>Seat</th>
              <th>Amount</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id}>
                <td className="mono">{b.id}</td>
                <td className="strong">{b.passenger}</td>
                <td>{b.route}</td>
                <td className="muted">{b.date}</td>
                <td className="mono">{b.seat}</td>
                <td className="strong">INR {b.amount}</td>
                <td>
                  <span className={`status-pill ${b.status}`}>{b.status}</span>
                </td>
                <td>
                  <button className="row-action" aria-label="Actions">
                    <FaEllipsisV />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default RecentBookings;
