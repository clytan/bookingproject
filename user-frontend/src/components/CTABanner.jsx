import Link from 'next/link';
import { FaArrowRight } from 'react-icons/fa';
import '../styles/CTABanner.css';

function CTABanner() {
  return (
    <section className="cta-banner">
      <div className="cta-shell">
        <div className="cta-glow" />
        <div className="cta-inner">
          <div>
            <span className="eyebrow cta-eyebrow">Plan your getaway</span>
            <h2 className="cta-title">
              Your <em>next adventure</em> is one search away.
            </h2>
            <p className="cta-sub">
              Browse trusted operators, mix activities into a single booking, and pay once at checkout.
            </p>
          </div>
          <div className="cta-actions">
            <Link href="/companies" className="cta-primary">
              Explore activities <FaArrowRight />
            </Link>
            <Link href="/hotels" className="cta-ghost">
              Or browse hotels
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CTABanner;
