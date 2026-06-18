'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  FaStar, FaMapMarkerAlt, FaClock, FaBuilding, FaCheckCircle,
  FaPlus, FaMinus, FaTrash, FaUsers, FaShoppingBag, FaCalendarAlt, FaChevronUp, FaChevronDown,
} from 'react-icons/fa';
import Navbar from '../../../components/Navbar.jsx';
import Footer from '../../../components/Footer.jsx';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/AuthContext';
import './Operator.css';

const CAT_LABEL = {
  snorkeling: 'Snorkeling', scuba_diving: 'Scuba Diving', surfing: 'Surfing',
  jet_ski: 'Jet Ski', kayaking: 'Kayaking', whale_watching: 'Whale Watching',
  banana_boat: 'Banana Boat', parasailing: 'Parasailing',
  catamaran_sailing: 'Catamaran Sailing', other: 'Other',
};

function OperatorInner() {
  const router     = useRouter();
  const params     = useSearchParams();
  const id         = params.get('id');
  const { user, loading: authLoading } = useAuth();
  const catFilter  = params.get('category') || '';
  const cityFilter = params.get('city')     || '';

  const today = new Date().toISOString().slice(0, 10);

  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const [date, setDate]       = useState(today);
  const [persons, setPersons] = useState(2);
  const [cart, setCart]       = useState({});

  const [availMap, setAvailMap]     = useState({});
  const [slotsCache, setSlotsCache] = useState({});
  const [expanded, setExpanded] = useState({});
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  const [submitting, setSubmitting]   = useState(false);
  const [successList, setSuccessList] = useState(null);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.operatorGet(id, { category: catFilter, city: cityFilter })
      .then((res) => {
        setData(res);
        if (catFilter && res.activities) {
          const firstHit = res.activities.find((a) => a.highlight);
          if (firstHit) setExpanded({ [firstHit.id]: true });
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, catFilter, cityFilter]);

  useEffect(() => { setAvailMap({}); }, [date]);

  const loadSlots = (actId) => {
    if (slotsCache[actId]) return;
    api.activityGet(actId)
      .then((res) => setSlotsCache((p) => ({ ...p, [actId]: res.slots })))
      .catch(() => {});
    if (!availMap[actId]?.[date]) {
      api.activityAvailability({ activity_id: actId, date })
        .then((res) => {
          setAvailMap((prev) => ({
            ...prev,
            [actId]: { ...(prev[actId] || {}), [date]: res.slots || {} },
          }));
        })
        .catch(() => {});
    }
  };

  useEffect(() => {
    Object.keys(expanded).forEach((actId) => {
      if (expanded[actId] && !availMap[actId]?.[date]) {
        api.activityAvailability({ activity_id: Number(actId), date })
          .then((res) => {
            setAvailMap((prev) => ({
              ...prev,
              [actId]: { ...(prev[actId] || {}), [date]: res.slots || {} },
            }));
          })
          .catch(() => {});
      }
    });
  }, [date, expanded, availMap]);

  const toggleCard = (actId) => {
    setExpanded((p) => {
      const isOpen = !!p[actId];
      const next = { ...p, [actId]: !isOpen };
      if (!isOpen) loadSlots(actId);
      return next;
    });
  };

  const pickSlot = (actId, slotId) => {
    setCart((p) => {
      const n = { ...p };
      if (n[actId] === slotId) delete n[actId];
      else n[actId] = slotId;
      return n;
    });
  };

  const removeFromCart = (actId) => {
    setCart((p) => {
      const n = { ...p };
      delete n[actId];
      return n;
    });
  };

  const allActivities = useMemo(() => data ? data.activities : [], [data]);

  const cartLines = useMemo(() => {
    const lines = [];
    for (const [actIdStr, slotId] of Object.entries(cart)) {
      const actId = Number(actIdStr);
      const activity = allActivities.find((x) => x.id === actId);
      const slots = slotsCache[actId];
      if (!activity || !slots) continue;
      const slot = slots.find((s) => s.id === slotId);
      if (!slot) continue;
      lines.push({
        activity_id: actId,
        activity_name: activity.name,
        activity_image: activity.image_url,
        slot_id: slotId,
        slot_label: slot.slot_label,
        departure_time: slot.departure_time,
        price_per_person: slot.price_per_person,
        line_total: slot.price_per_person * persons,
      });
    }
    return lines;
  }, [cart, allActivities, slotsCache, persons]);

  const grandTotal = cartLines.reduce((s, l) => s + l.line_total, 0);

  const checkout = async () => {
    setSubmitError('');
    if (cartLines.length === 0) return;
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(`/operators/detail?id=${id}`)}`);
      return;
    }
    setSubmitting(true);
    try {
      const items = cartLines.map((l) => ({ slot_id: l.slot_id, date, persons: Number(persons) }));
      const res = await api.activityBookMany(items);
      setSuccessList(res);
      setCart({});
    } catch (e) {
      setSubmitError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="op-loading">
          <div className="op-spinner" />
          <p>Loading company…</p>
        </div>
      </>
    );
  }
  if (error)   return <><Navbar /><div className="op-error">{error}</div></>;
  if (!data)   return null;

  const { operator, cities, grouped } = data;

  if (successList) {
    return (
      <>
        <Navbar />
        <div className="op-page">
          <div className="op-success">
            <FaCheckCircle className="op-success-icon" />
            <h1>Trip confirmed!</h1>
            <p className="op-success-sub">
              {successList.count} booking{successList.count > 1 ? 's' : ''} ·
              <strong> INR {Number(successList.grand_total).toLocaleString()}</strong> total
            </p>
            <div className="op-success-list">
              {successList.bookings.map((b) => (
                <div key={b.booking_code} className="op-success-row">
                  <div>
                    <strong>{b.activity}</strong>
                    <div className="op-success-meta">
                      {b.slot_label} · {b.date} at {String(b.departure_time).slice(0,5)} · {b.persons} guest{b.persons > 1 ? 's' : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="op-success-code">{b.booking_code}</div>
                    <div className="op-success-amt">INR {Number(b.total_amount).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="op-success-actions">
              <button className="op-btn op-btn-primary" onClick={() => router.push('/my-bookings')}>View my bookings</button>
              <button className="op-btn op-btn-ghost" onClick={() => router.push('/companies')}>Browse more</button>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const totalActs = data.activities.length;

  return (
    <>
      <Navbar />

      <div className="op-hero">
        <div className="op-hero-shell">
          <div className="op-hero-badge"><FaBuilding /> Water Sports Company</div>
          <h1 className="op-hero-name">{operator.full_name}</h1>
          <div className="op-hero-stats">
            <span><FaShoppingBag /> {totalActs} activit{totalActs === 1 ? 'y' : 'ies'}</span>
            <span><FaMapMarkerAlt /> {cities.join(' · ')}</span>
            {catFilter && (
              <span className="op-hero-chip">Spotlighting {CAT_LABEL[catFilter] || catFilter}</span>
            )}
          </div>
        </div>
      </div>

      <div className="op-page op-with-cart">
        <main className="op-main">
          {grouped.length === 0 ? (
            <div className="op-empty">This company has no active activities yet.</div>
          ) : (
            grouped.map((g) => (
              <section key={g.city} className="op-city-section">
                <div className="op-city-head">
                  <h2><FaMapMarkerAlt /> {g.city}</h2>
                  <span className="op-city-count">{g.activities.length} activit{g.activities.length === 1 ? 'y' : 'ies'}</span>
                </div>

                <div className="op-act-grid">
                  {g.activities.map((a) => {
                    const inCart  = cart[a.id] != null;
                    const isOpen  = !!expanded[a.id];
                    const slots   = slotsCache[a.id];
                    const pickedSlotId = cart[a.id];
                    const pickedSlot   = slots?.find((s) => s.id === pickedSlotId);

                    return (
                      <article
                        key={a.id}
                        className={`op-card ${a.highlight ? 'is-highlight' : ''} ${inCart ? 'is-in-cart' : ''}`}
                      >
                        <div className="op-card-img" style={{ backgroundImage: `url(${a.image_url})` }}>
                          <span className="op-card-cat">{CAT_LABEL[a.category] || a.category}</span>
                          {inCart && <span className="op-card-incart"><FaCheckCircle /> In trip</span>}
                        </div>

                        <div className="op-card-body">
                          <div className="op-card-titlerow">
                            <h3>{a.name}</h3>
                            <span className="op-rating"><FaStar /> {a.user_rating}</span>
                          </div>

                          <div className="op-card-pills">
                            <span><FaClock /> {a.duration_min} min</span>
                            <span className="cap">{a.difficulty}</span>
                            <span className="loc"><FaMapMarkerAlt /> {a.city}</span>
                          </div>

                          {a.description && <p className="op-card-desc">{a.description}</p>}

                          <div className="op-card-priceline">
                            <div>
                              <span className="op-from-label">from</span>{' '}
                              <strong className="op-from-price">INR {Number(a.from_price || 0).toLocaleString()}</strong>
                              <span className="op-from-unit"> / person</span>
                            </div>
                            <button className="op-card-expand" onClick={() => toggleCard(a.id)}>
                              {isOpen ? <>Hide times <FaChevronUp /></> : <>Choose time <FaChevronDown /></>}
                            </button>
                          </div>

                          {isOpen && (
                            <div className="op-slots">
                              {!slots && <div className="op-slots-loading">Loading times…</div>}
                              {slots && slots.length === 0 && <div className="op-slots-loading">No times available.</div>}
                              {slots && slots.map((s) => {
                                const cap    = availMap[a.id]?.[date]?.[s.id];
                                const free   = cap ? cap.available : s.max_persons;
                                const sold   = cap && cap.fully_booked;
                                const tooBig = persons > s.max_persons;
                                const picked = cart[a.id] === s.id;
                                const disabled = sold || tooBig;
                                return (
                                  <button
                                    key={s.id}
                                    type="button"
                                    className={`op-slot ${picked ? 'is-picked' : ''} ${disabled ? 'is-disabled' : ''}`}
                                    onClick={() => !disabled && pickSlot(a.id, s.id)}
                                    disabled={disabled}
                                  >
                                    <div className="op-slot-time">
                                      <FaClock />
                                      <strong>{String(s.departure_time).slice(0,5)}</strong>
                                      <span>{s.duration_min} min</span>
                                    </div>
                                    <div className="op-slot-label">{s.slot_label}</div>
                                    <div className="op-slot-cap">
                                      <span className={`op-slot-avail ${sold ? 'red' : free <= 2 ? 'amber' : 'green'}`}>
                                        {sold ? 'Sold out' : `${free} left`}
                                      </span>
                                      <span className="op-slot-price">INR {Number(s.price_per_person).toLocaleString()}</span>
                                    </div>
                                    <div className="op-slot-cta">
                                      {picked ? <><FaCheckCircle /> Selected</> : tooBig ? `Max ${s.max_persons}` : 'Add'}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {inCart && pickedSlot && (
                            <div className="op-card-summary">
                              <span><FaCheckCircle /> {pickedSlot.slot_label} · {String(pickedSlot.departure_time).slice(0,5)} · {persons} guest{persons > 1 ? 's' : ''}</span>
                              <strong>INR {Number(pickedSlot.price_per_person * persons).toLocaleString()}</strong>
                            </div>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </main>

        <aside className={`op-cart ${mobileCartOpen ? 'is-open' : ''}`}>
          <button className="op-cart-mobile-close" onClick={() => setMobileCartOpen(false)} aria-label="Close cart">×</button>
          <div className="op-cart-inner">
            <header className="op-cart-head">
              <h3><FaShoppingBag /> Your trip</h3>
              <span className="op-cart-count">{cartLines.length}</span>
            </header>

            <div className="op-cart-fields">
              <label className="op-cart-field">
                <span><FaCalendarAlt /> Date</span>
                <input type="date" value={date} min={today} onChange={(e) => setDate(e.target.value)} />
              </label>

              <label className="op-cart-field">
                <span><FaUsers /> Guests</span>
                <div className="op-stepper">
                  <button type="button" onClick={() => setPersons(Math.max(1, persons - 1))} aria-label="decrease"><FaMinus /></button>
                  <span>{persons}</span>
                  <button type="button" onClick={() => setPersons(Math.min(20, persons + 1))} aria-label="increase"><FaPlus /></button>
                </div>
              </label>
            </div>

            <div className="op-cart-lines">
              {cartLines.length === 0 ? (
                <div className="op-cart-empty">
                  <FaShoppingBag style={{ fontSize: 28, opacity: 0.3, marginBottom: 8 }} />
                  <p>Your trip is empty</p>
                  <small>Pick a time from any activity to add it here</small>
                </div>
              ) : (
                cartLines.map((l) => (
                  <div key={`${l.activity_id}-${l.slot_id}`} className="op-cart-line">
                    <div className="op-cart-thumb" style={l.activity_image ? { backgroundImage: `url(${l.activity_image})` } : undefined} />
                    <div className="op-cart-info">
                      <div className="op-cart-name">{l.activity_name}</div>
                      <div className="op-cart-sub">{l.slot_label} · {String(l.departure_time).slice(0,5)}</div>
                    </div>
                    <div className="op-cart-amt">
                      <div className="op-cart-price">INR {Number(l.line_total).toLocaleString()}</div>
                      <button className="op-cart-remove" onClick={() => removeFromCart(l.activity_id)} aria-label="remove"><FaTrash /></button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cartLines.length > 0 && (
              <div className="op-cart-total">
                <span>Total</span>
                <strong>INR {Number(grandTotal).toLocaleString()}</strong>
              </div>
            )}

            {submitError && <div className="op-cart-error">{submitError}</div>}

            <button
              className="op-btn op-btn-primary op-cart-btn"
              disabled={cartLines.length === 0 || submitting || authLoading}
              onClick={checkout}
            >
              {submitting ? 'Booking…'
                : !user ? 'Login to book'
                : cartLines.length === 0 ? 'Pick a time to start'
                : `Confirm ${cartLines.length} booking${cartLines.length > 1 ? 's' : ''}`}
            </button>
          </div>
        </aside>

        {cartLines.length > 0 && !mobileCartOpen && (
          <button className="op-mobile-bar" onClick={() => setMobileCartOpen(true)}>
            <span><FaShoppingBag /> {cartLines.length} item{cartLines.length > 1 ? 's' : ''}</span>
            <span>INR {Number(grandTotal).toLocaleString()}</span>
            <span className="op-mobile-bar-cta">Review →</span>
          </button>
        )}
      </div>
      <Footer />
    </>
  );
}

export default function OperatorPage() {
  return (
    <Suspense fallback={<div style={{ padding: 60 }}>Loading…</div>}>
      <OperatorInner />
    </Suspense>
  );
}
