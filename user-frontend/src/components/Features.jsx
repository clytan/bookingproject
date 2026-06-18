import { FaShieldAlt, FaTicketAlt, FaHeadset, FaPercent } from 'react-icons/fa';
import '../styles/Features.css';

const features = [
  { icon: <FaShieldAlt />, title: 'Secure Bookings',       desc: 'Bank-grade encryption protects every booking and payment.' },
  { icon: <FaTicketAlt />, title: 'Instant Confirmation',  desc: 'E-tickets and hotel vouchers in your inbox within seconds.' },
  { icon: <FaHeadset />,   title: '24/7 Support',          desc: 'Real humans on call, every day, for bus or hotel questions.' },
  { icon: <FaPercent />,   title: 'Best Prices, Combined', desc: 'Save more by bundling your bus ticket with a hotel stay.' },
];

function Features() {
  return (
    <section className="features" id="about">
      <div className="section-header dark">
        <h2>Why Choose COKALO?</h2>
        <p>Buses, hotels and everything in between — all on one trusted platform</p>
      </div>

      <div className="features-grid">
        {features.map((f, idx) => (
          <div key={idx} className="feature-card">
            <div className="feature-icon">{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Features;
