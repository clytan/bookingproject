'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FaHotel, FaTachometerAlt, FaBed, FaCalendarCheck, FaPlusCircle, FaSignOutAlt, FaChartBar, FaBuilding } from 'react-icons/fa';
import { clearToken } from '../lib/api';
import './Sidebar.css';

const menu = [
  { icon: <FaTachometerAlt />, label: 'Dashboard',    href: '/' },
  { icon: <FaBed />,            label: 'Rooms',         href: '/rooms' },
  { icon: <FaCalendarCheck />,  label: 'Bookings',      href: '/bookings' },
  { icon: <FaPlusCircle />,     label: 'New Booking',   href: '/bookings/new' },
  { icon: <FaChartBar />,       label: 'Reports',       href: '/reports' },
  { icon: <FaBuilding />,       label: 'Hotel Profile', href: '/profile' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();

  const logout = () => { clearToken(); router.push('/login'); };
  const isActive = (h) => h === '/' ? pathname === '/' : pathname === h || pathname.startsWith(h + '/');

  return (
    <aside className="m-sidebar">
      <div className="m-logo">
        <FaHotel />
        <span>Hotel Portal</span>
      </div>
      <nav className="m-menu">
        {menu.map((item) => (
          <Link key={item.href} href={item.href} className={`m-item ${isActive(item.href) ? 'active' : ''}`}>
            <span className="m-icon">{item.icon}</span>
            <span className="m-label">{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="m-footer">
        <button className="m-item logout" onClick={logout}>
          <span className="m-icon"><FaSignOutAlt /></span>
          <span className="m-label">Logout</span>
        </button>
      </div>
    </aside>
  );
}
