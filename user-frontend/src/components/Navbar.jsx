'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaUserCircle, FaSignOutAlt, FaTicketAlt, FaCaretDown } from 'react-icons/fa';
import { useAuth } from '../lib/AuthContext';
import '../styles/Navbar.css';

function Navbar() {
  const { user, loading, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    router.push('/');
  };

  const initial = user?.name ? user.name.trim()[0].toUpperCase() : '?';

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link href="/" className="nav-logo" aria-label="COKALO home">
          <img src="/cokalo-logo.jpg" alt="COKALO" />
        </Link>

        <ul className="nav-links">
          <li><Link href="/hotels">Hotels</Link></li>
          <li><Link href="/companies">Water Activities</Link></li>
          {user && <li><Link href="/my-bookings">My Bookings</Link></li>}
          <li><a href="#help">Help</a></li>
        </ul>

        <div className="nav-actions">
          {loading ? null : user ? (
            <div className="user-menu">
              <button className="user-trigger" onClick={() => setMenuOpen((o) => !o)}>
                <span className="user-avatar">{initial}</span>
                <span className="user-name-text">{user.name.split(' ')[0]}</span>
                <FaCaretDown />
              </button>

              {menuOpen && (
                <>
                  <div className="menu-overlay" onClick={() => setMenuOpen(false)} />
                  <div className="user-dropdown">
                    <div className="dropdown-header">
                      <div className="dropdown-name">{user.name}</div>
                      <div className="dropdown-email">{user.email}</div>
                    </div>
                    <Link href="/my-bookings" className="dropdown-item" onClick={() => setMenuOpen(false)}>
                      <FaTicketAlt /> My Bookings
                    </Link>
                    <Link href="/profile" className="dropdown-item" onClick={() => setMenuOpen(false)}>
                      <FaUserCircle /> Profile
                    </Link>
                    <button className="dropdown-item danger" onClick={handleLogout}>
                      <FaSignOutAlt /> Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">Login</Link>
              <Link href="/register" className="btn-primary">
                <FaUserCircle /> Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
