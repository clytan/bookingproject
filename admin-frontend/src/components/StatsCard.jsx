import { FaArrowUp, FaArrowDown } from 'react-icons/fa';
import '../styles/StatsCard.css';

/**
 * StatsCard
 *  - icon, label, value: required
 *  - change + trend: legacy "+12.4% vs last week" badge (shown only if change starts with + or -)
 *  - otherwise `change` is rendered as a subtle note line (e.g. "Last 30 days")
 */
function StatsCard({ icon, label, value, change, trend, color }) {
  const isDelta = typeof change === 'string' && /^[+-]/.test(change);

  return (
    <div className="stats-card">
      <div className={`stats-icon ${color}`}>{icon}</div>
      <div className="stats-body">
        <span className="stats-label">{label}</span>
        <span className="stats-value">{value}</span>
        {change && (
          isDelta ? (
            <span className={`stats-change ${trend}`}>
              {trend === 'up' ? <FaArrowUp /> : <FaArrowDown />} {change}
              <span className="period">vs last week</span>
            </span>
          ) : (
            <span className="stats-note">{change}</span>
          )
        )}
      </div>
    </div>
  );
}

export default StatsCard;
