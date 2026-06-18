import { FaSearchLocation, FaUmbrellaBeach, FaPlaneDeparture } from 'react-icons/fa';
import '../styles/HowItWorks.css';

const STEPS = [
  {
    n: '01',
    icon: <FaSearchLocation />,
    title: 'Find your spot',
    body: 'Search by city or activity. Compare hotels and water-sport operators side by side.',
  },
  {
    n: '02',
    icon: <FaUmbrellaBeach />,
    title: 'Build your trip',
    body: 'Add multiple activities from a single operator to one shared date and guest count.',
  },
  {
    n: '03',
    icon: <FaPlaneDeparture />,
    title: 'Show up & enjoy',
    body: 'Get instant confirmations. No phone calls, no chasing — just turn up at the dock.',
  },
];

function HowItWorks() {
  return (
    <section className="hiw">
      <div className="hiw-shell">
        <div className="hiw-head">
          <span className="eyebrow">How it works</span>
          <h2 className="hiw-title">
            From idea to <em>oceanside</em> in three steps
          </h2>
        </div>

        <div className="hiw-steps">
          {STEPS.map((s) => (
            <div key={s.n} className="hiw-step">
              <span className="hiw-num">{s.n}</span>
              <div className="hiw-icon">{s.icon}</div>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
