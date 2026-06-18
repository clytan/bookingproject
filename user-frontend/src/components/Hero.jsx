'use client';

import { useEffect, useState } from 'react';
import SearchBar from './SearchBar.jsx';
import '../styles/Hero.css';

const SLIDES = [
  {
    key: 'coast',
    eyebrow: 'Coastal Escapes',
    titleA: 'Curated',
    titleItalic: 'stays',
    titleConnector: 'on the',
    titleGradient: 'azure coast',
    sub: 'Boutique hotels handpicked for ocean views, intimate service, and design that lingers.',
    scene: 'scene-coast',
  },
  {
    key: 'dive',
    eyebrow: 'Beneath the Surface',
    titleA: 'Dive into',
    titleItalic: 'living',
    titleConnector: '',
    titleGradient: 'coral worlds',
    sub: 'Trusted operators for scuba, snorkeling, and reef exploration — book by the slot, not the package.',
    scene: 'scene-dive',
  },
  {
    key: 'ride',
    eyebrow: 'Adrenaline & Air',
    titleA: 'Ride the',
    titleItalic: 'open',
    titleConnector: '',
    titleGradient: 'water sky',
    sub: 'Surf, jet ski, parasail and beyond. Mix multiple activities into a single, painless booking.',
    scene: 'scene-ride',
  },
  {
    key: 'sail',
    eyebrow: 'Slow & Cinematic',
    titleA: 'Sunsets',
    titleItalic: 'over',
    titleConnector: '',
    titleGradient: 'still water',
    sub: 'Catamaran sails, whale watching, and quiet days where the only schedule is the tide.',
    scene: 'scene-sail',
  },
];

const TICKER = [
  'Snorkeling', 'Scuba diving', 'Surfing', 'Jet ski',
  'Kayaking', 'Whale watching', 'Parasailing', 'Catamaran sailing',
  'Banana boat', 'Boutique stays',
];

export default function Hero() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % SLIDES.length), 6500);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="hero" id="home">
      {/* Slides — all stacked, only one visible at a time */}
      <div className="hero-stage" aria-hidden="true">
        {SLIDES.map((s, i) => (
          <div
            key={s.key}
            className={`hero-slide ${s.scene} ${i === idx ? 'is-active' : ''}`}
          />
        ))}
        <div className="hero-grid" />
        <div className="hero-vignette" />
      </div>

      {/* Floating decoration: thin aurora line + scroll cue */}
      <div className="hero-rail" aria-hidden="true" />
      <div className="hero-scroll" aria-hidden="true">
        <span>Scroll</span>
        <i />
      </div>

      <div className="hero-content">
        {SLIDES.map((s, i) => (
          <div
            key={s.key}
            className={`hero-copy ${i === idx ? 'is-active' : ''}`}
            aria-hidden={i !== idx}
          >
            <span className="hero-eyebrow">{s.eyebrow}</span>
            <h1 className="hero-title">
              <span className="hero-line">
                <span className="hero-word">{s.titleA}</span>{' '}
                <span className="hero-word hero-italic">{s.titleItalic}</span>
              </span>
              <span className="hero-line">
                {s.titleConnector && <span className="hero-word hero-connector">{s.titleConnector} </span>}
                <span className="hero-word hero-gradient">{s.titleGradient}</span>
              </span>
            </h1>
            <p className="hero-subtitle">{s.sub}</p>
          </div>
        ))}

        <div className="hero-search">
          <SearchBar />
        </div>

        <div className="hero-dots" role="tablist" aria-label="Hero slides">
          {SLIDES.map((s, i) => (
            <button
              key={s.key}
              role="tab"
              aria-selected={i === idx}
              aria-label={`Show slide ${i + 1}: ${s.eyebrow}`}
              className={`hero-dot ${i === idx ? 'is-active' : ''}`}
              onClick={() => setIdx(i)}
            >
              <span />
            </button>
          ))}
        </div>
      </div>

      {/* Marquee ticker of activity tags */}
      <div className="hero-marquee" aria-hidden="true">
        <div className="hero-marquee-track">
          {[...TICKER, ...TICKER].map((t, i) => (
            <span key={i} className="hero-tag">
              <i className="dot" /> {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
