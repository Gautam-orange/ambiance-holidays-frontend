import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { Users, Clock, MapPin, CheckCircle2, XCircle, ChevronLeft, ShoppingCart, Check, AlertCircle, LogIn } from 'lucide-react';
import { catalogTourBySlug, Tour } from '../api/tours';
import { addToCart } from '../api/bookings';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

const fmt = (cents: number) => `$${(cents / 100).toLocaleString('en-US')}`;

export default function TourDetails() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paxAdults, setPaxAdults] = useState(2);
  const [paxChildren, setPaxChildren] = useState(0);
  const [markup, setMarkup] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    catalogTourBySlug(slug)
      .then(r => { setTour(r.data); if (r.data.pickupZones?.length) setSelectedZoneId(r.data.pickupZones[0].id); })
      .catch(() => setError('Tour not found'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="text-slate-400">Loading…</div></div>;
  if (error || !tour) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
      <p className="text-slate-500">Tour not found</p>
      <Link to="/tours" className="text-brand-primary hover:underline">Back to Tours</Link>
    </div>
  );

  const isOnRequest = (tour as any).availabilityMode === 'on_request' || tour.status === 'ON_REQUEST';
  const markupPct = parseFloat(markup) || 0;
  const zone = tour.pickupZones?.find(z => z.id === selectedZoneId);
  const zoneExtra = zone?.extraCents ?? 0;

  const adultTotal = tour.adultPriceCents * paxAdults;
  const childTotal = tour.childPriceCents * paxChildren;
  const subtotal = adultTotal + childTotal + zoneExtra;
  const markupAmt = Math.round(subtotal * markupPct / 100);
  const grandTotal = subtotal + markupAmt;

  const handleAction = async () => {
    if (!user) { navigate('/auth/login', { state: { from: location } }); return; }
    if (!tour) return;
    if (isOnRequest) {
      navigate('/contact', { state: { subject: `Enquiry: ${tour.title}` } });
      return;
    }
    setAdding(true);
    try {
      await addToCart({
        itemType: 'TOUR',
        refId: tour.id,
        quantity: paxAdults,
        options: { paxAdults, paxChildren, markupPercent: markupPct || undefined, pickupZoneId: selectedZoneId || undefined },
      });
      setAdded(true);
      setTimeout(() => setAdded(false), 3000);
    } catch (e: any) {
      alert(e?.response?.data?.error?.message ?? 'Could not add to cart');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Hero */}
      <div className="relative h-[60vh] overflow-hidden">
        {tour.coverImageUrl
          ? <img src={tour.coverImageUrl} className="w-full h-full object-cover" />
          : <div className="w-full h-full bg-brand-primary flex items-center justify-center text-6xl">{tour.category === 'SEA' ? '🌊' : tour.category === 'AIR' ? '🪂' : '🏔️'}</div>}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 max-w-7xl mx-auto">
          <Link to="/tours" className="flex items-center gap-2 text-white/70 text-sm mb-4 hover:text-white">
            <ChevronLeft className="w-4 h-4" /> Back to Tours
          </Link>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 bg-brand-primary text-white text-xs font-bold rounded-full uppercase tracking-wider">{tour.category}</span>
                {isOnRequest && <span className="px-3 py-1 bg-yellow-500 text-white text-xs font-bold rounded-full uppercase tracking-wider">On Request</span>}
              </div>
              <h1 className="text-4xl md:text-5xl font-display font-bold text-white leading-tight">{tour.title}</h1>
              <div className="flex flex-wrap items-center gap-5 mt-3 text-white/70 text-sm">
                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{tour.region}</span>
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{tour.duration.replace('_', ' ')}{tour.durationHours ? ` (~${tour.durationHours}h)` : ''}</span>
                <span className="flex items-center gap-1.5"><Users className="w-4 h-4" />{tour.minPax}–{tour.maxPax} guests</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-16 grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-10">
          {tour.description && (
            <section>
              <h2 className="text-2xl font-display font-bold text-slate-900 mb-4">About This Tour</h2>
              <p className="text-slate-600 leading-relaxed">{tour.description}</p>
            </section>
          )}

          {tour.itineraryStops?.length > 0 && (
            <section>
              <h2 className="text-2xl font-display font-bold text-slate-900 mb-6">Itinerary</h2>
              <div className="space-y-0">
                {tour.itineraryStops.map((stop, i) => (
                  <div key={stop.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-brand-primary text-white text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</div>
                      {i < tour.itineraryStops.length - 1 && <div className="w-0.5 bg-brand-primary/20 flex-1 mt-1" />}
                    </div>
                    <div className="pb-6">
                      <div className="flex items-center gap-3 mb-1">
                        {stop.stopTime && <span className="text-xs font-bold text-brand-primary">{stop.stopTime}</span>}
                        <p className="font-bold text-slate-800">{stop.title}</p>
                      </div>
                      {stop.description && <p className="text-sm text-slate-500">{stop.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {tour.includes?.length > 0 && (
              <section>
                <h2 className="text-lg font-display font-bold text-slate-900 mb-4">What's Included</h2>
                <ul className="space-y-2">
                  {tour.includes.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />{item}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {tour.excludes?.length > 0 && (
              <section>
                <h2 className="text-lg font-display font-bold text-slate-900 mb-4">Not Included</h2>
                <ul className="space-y-2">
                  {tour.excludes.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                      <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />{item}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {tour.importantNotes?.length > 0 && (
            <section className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-yellow-800 mb-3">Important Notes</h2>
              <ul className="space-y-1">
                {tour.importantNotes.map((note, i) => <li key={i} className="text-sm text-yellow-700">• {note}</li>)}
              </ul>
            </section>
          )}

          {/* Cancellation Policy — salmon/pink bg per design */}
          <section className="bg-orange-50 border border-orange-200 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-lg font-bold text-orange-800 mb-2">Cancellation Policy</h2>
                <ul className="space-y-1 text-sm text-orange-700">
                  <li>• Free cancellation up to 48 hours before the service date.</li>
                  <li>• 50% fee if cancelled within 48–24 hours.</li>
                  <li>• 75% fee if cancelled within 24–12 hours.</li>
                  <li>• No refund within 12 hours of the service date.</li>
                </ul>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar booking widget */}
        <div className="space-y-6">
          {tour.pickupZones?.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-bold text-slate-800 mb-4">Pickup Zone</h3>
              <select value={selectedZoneId} onChange={e => setSelectedZoneId(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-primary">
                {tour.pickupZones.map(z => (
                  <option key={z.id} value={z.id}>
                    {z.zoneName}{z.extraCents > 0 ? ` (+${fmt(z.extraCents)})` : ''}{z.pickupTime ? ` @ ${z.pickupTime}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
            <h3 className="font-bold text-slate-800">Book This Tour</h3>

            {/* Adults */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Adults — {fmt(tour.adultPriceCents)} each</label>
              <div className="flex items-center gap-3">
                <button onClick={() => setPaxAdults(p => Math.max(1, p - 1))} className="w-9 h-9 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50">−</button>
                <span className="font-bold text-slate-800 w-6 text-center">{paxAdults}</span>
                <button onClick={() => setPaxAdults(p => Math.min(tour.maxPax, p + 1))} className="w-9 h-9 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50">+</button>
              </div>
            </div>

            {/* Children */}
            {tour.childPriceCents > 0 && (
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Children — {fmt(tour.childPriceCents)} each</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setPaxChildren(p => Math.max(0, p - 1))} className="w-9 h-9 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50">−</button>
                  <span className="font-bold text-slate-800 w-6 text-center">{paxChildren}</span>
                  <button onClick={() => setPaxChildren(p => p + 1)} className="w-9 h-9 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50">+</button>
                </div>
              </div>
            )}

            {/* Markup */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Mark Up (%)</label>
              <input type="number" min="0" max="100" step="0.5" placeholder="0" value={markup} onChange={e => setMarkup(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-primary" />
            </div>

            {/* Pricing summary */}
            <div className="border-t border-slate-100 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Base fare</span><span>{fmt(subtotal - zoneExtra)}</span>
              </div>
              {zoneExtra > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Pickup ({zone?.zoneName})</span><span>+{fmt(zoneExtra)}</span>
                </div>
              )}
              {markupAmt > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Markup ({markupPct}%)</span><span>+{fmt(markupAmt)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-slate-800 pt-2 border-t border-slate-100">
                <span>Total</span><span className="text-brand-primary">{fmt(grandTotal)}</span>
              </div>
            </div>

            {added ? (
              <Link to="/cart" className="w-full bg-green-500 text-white py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg">
                <Check className="w-4 h-4" /> View Cart
              </Link>
            ) : (
              <button onClick={handleAction} disabled={adding}
                className="w-full bg-brand-primary text-white py-3.5 rounded-2xl font-bold hover:bg-brand-secondary transition-all shadow-lg shadow-brand-primary/20 disabled:opacity-60 flex items-center justify-center gap-2">
                {!user ? (
                  <><LogIn className="w-4 h-4" /> Login to Book</>
                ) : isOnRequest ? (
                  <><ShoppingCart className="w-4 h-4" /> Request Booking</>
                ) : adding ? (
                  'Adding…'
                ) : (
                  <><ShoppingCart className="w-4 h-4" /> Add to Cart</>
                )}
              </button>
            )}

            {isOnRequest && (
              <p className="text-xs text-center text-slate-400">This tour requires admin confirmation. We'll contact you within 24 hours.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
