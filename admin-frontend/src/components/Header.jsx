import { FaSearch, FaBell, FaEnvelope } from 'react-icons/fa';
import '../styles/Header.css';

function Header({ title = 'Dashboard', subtitle = "Welcome back, Admin. Here is what's happening today." }) {
  return (
    <header className="header">
      <div className="header-left">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      <div className="header-right">
        <div className="header-search">
          <FaSearch />
          <input type="text" placeholder="Search bookings, users, routes..." />
        </div>

        <button className="icon-btn" aria-label="Notifications">
          <FaBell />
          <span className="badge">5</span>
        </button>

        <button className="icon-btn" aria-label="Messages">
          <FaEnvelope />
          <span className="badge">2</span>
        </button>

        <div className="user-chip">
          <div className="avatar">AD</div>
          <div className="user-info">
            <span className="user-name">Admin User</span>
            <span className="user-role">Super Admin</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
