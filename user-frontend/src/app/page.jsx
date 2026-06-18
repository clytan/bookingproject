import Navbar from '../components/Navbar.jsx';
import Hero from '../components/Hero.jsx';
import TrustStrip from '../components/TrustStrip.jsx';
import FeaturedActivities from '../components/FeaturedActivities.jsx';
import HowItWorks from '../components/HowItWorks.jsx';
import FeaturedHotels from '../components/FeaturedHotels.jsx';
import CTABanner from '../components/CTABanner.jsx';
import Features from '../components/Features.jsx';
import Footer from '../components/Footer.jsx';

export default function HomePage() {
  return (
    <>
      <Navbar />
      <Hero />
      <TrustStrip />
      <FeaturedActivities />
      <HowItWorks />
      <FeaturedHotels />
      <CTABanner />
      <Features />
      <Footer />
    </>
  );
}
