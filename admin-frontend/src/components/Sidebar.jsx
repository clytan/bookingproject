'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FaBus, FaHotel, FaBed, FaTachometerAlt, FaRoute, FaCalendarAlt,
  FaTicketAlt, FaConciergeBell, FaUsers, FaChartBar, FaCog, FaSignOutAlt,
  FaWater, FaClock, FaSwimmer
} from 'react-icons/fa';
import { clearToken } from '../lib/api';
import '../styles/Sidebar.css';

const menu = [
  { icon: <FaTachometerAlt />, label: 'Dashboard',       href: '/' },
  { type: 'section', label: 'Bus' },
  { icon: <FaBus />,           label: 'Buses',           href: '/buses' },
  { icon: <FaRoute />,         label: 'Routes',          href: '/routes' },
  { icon: <FaCalendarAlt />,   label: 'Schedules',       href: '/schedules' },
  { icon: <FaTicketAlt />,     label: 'Bus Bookings',    href: '/bookings' },
  { type: 'section', label: 'Hotel' },
  { icon: <FaHotel />,         label: 'Hotels',          href: '/hotels' },
  { icon: <FaBed />,           label: 'Hotel Rooms',     href: '/hotel-rooms' },
  { icon: <FaConciergeBell />, label: 'Hotel Bookings',  href: '/hotel-bookings' },
  { type: 'section', label: 'Water Activities' },
  { icon: <FaWater />,         label: 'Activities',         href: '/activities' },
  { icon: <FaUsers />,         label: 'Operators',          href: '/operators' },
  { icon: <FaClock />,         label: 'Activity Slots',     href: '/activity-slots' },
  { icon: <FaSwimmer />,       label: 'Activity Bookings',  href: '/activity-bookings' },
  { type: 'section', label: 'System' },
  { icon: <FaUsers />,         label: 'Users',           href: '/users' },
  { icon: <FaChartBar />,      label: 'Reports',         href: '/reports' },
  { icon: <FaCog />,           label: 'Settings',        href: '/settings' },
];

function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();

  const handleLogout = () => {
    clearToken();
    router.push('/login');
  };

  const isActive = (href) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <FaBus />
        <span>COKALO Admin</span>
      </div>

      <nav className="sidebar-menu">
        {menu.map((item, i) => {
          if (item.type === 'section') {
            return <div key={`s-${i}`} className="menu-section">{item.label}</div>;
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`menu-item ${isActive(item.href) ? 'active' : ''}`}
            >
              <span className="menu-icon">{item.icon}</span>
              <span className="menu-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button className="menu-item logout" onClick={handleLogout}>
          <span className="menu-icon"><FaSignOutAlt /></span>
          <span className="menu-label">Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
