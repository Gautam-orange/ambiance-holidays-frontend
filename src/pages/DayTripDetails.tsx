import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin, Plus, Minus, LogIn, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { addToCart as addToCartApi } from '../api/bookings';

type DayTripDetail = {
  id: string;
  title: string;
  region: string;
  tripType: string;
  duration: string;
  adultPriceCents: number;
  childPriceCents: number;
  netRatePerPaxCents: number;
  markupPct: number;
  maxPax: number;
  description: string;
  includes: string[];
  excludes: string[];
  coverImageUrl: string;
  availabilityMode: 'always' | 'on_request';
  highlights: { id: string; text: string }[];
  itineraryStops: { id: string; stopOrder: number; title: string; timeLabel: string; location: string; description: string }[];
  pickupZones: { id: string; zoneName: string; hotelName: string; pickupTimeFrom: string; pickupTimeTo: string }[];
};

export default function DayTripDetails() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [trip, setTrip] = useState<DayTripDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [markup, setMarkup] = useState(0);
  const [date, setDate] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  useEffect(() => {
    fetch(`/api/v1/catalog/day-trips/${slug}`)
      .then(r => r.json())
      .then(d => setTrip(d.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!trip) return <div className="text-center py-20 text-gray-500">Day trip not found.</div>;

  const highlights = trip.highlights ?? [];
  const itineraryStops = trip.itineraryStops ?? [];
  const pickupZones = trip.pickupZones ?? [];

  const pax = adults + children;
  const net = trip.adultPriceCents * adults + (trip.childPriceCents ?? trip.adultPriceCents) * children;
  const vat = Math.round(net * 0.15);
  const markupAmt = Math.round(net * markup / 100);
  const total = net + vat + markupAmt;
  const fmt = (c: number) => `$${(c / 100).toLocaleString('en-US')}`;

  const addToCart = async () => {
    if (!user) { navigate('/auth/login', { state: { from: location } }); return; }
    if (!date) { setAddError('Please choose a service date.'); return; }
    setAddError('');
    setAdding(true);
    try {
      await addToCartApi({
        itemType: 'DAY_TRIP',
        refId: trip.id,
        quantity: 1,
        options: {
          paxAdults: adults,
          paxChildren: children,
          date,
          markupPct: markup > 0 ? markup : undefined,
          unitPriceCents: total,
        },
      });
      navigate('/cart');
    } catch (e: any) {
      setAddError(e?.response?.data?.error?.message ?? e?.response?.data?.message ?? 'Could not add to cart. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Local Experiences
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {trip.coverImageUrl && (
            <img src={trip.coverImageUrl} alt={trip.title} className="w-full h-72 object-cover rounded-2xl" />
          )}

          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              {highlights.map((h, i) => (
                <span key={h.id ?? i} className="px-3 py-1 bg-brand-primary/10 text-brand-primary rounded-full text-xs font-medium">{h.text}</span>
              ))}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{trip.title}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{trip.region}</span>
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{trip.duration.replace('_', ' ')}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${trip.tripType === 'SHARED' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{trip.tripType}</span>
            </div>
          </div>

          {trip.description && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">About This Trip</h2>
              <p className="text-gray-600 text-sm leading-relaxed">{trip.description}</p>
            </div>
          )}

          {/* Itinerary */}
          {itineraryStops.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Itinerary</h2>
              <div className="space-y-4">
                {itineraryStops.sort((a, b) => a.stopOrder - b.stopOrder).map((stop, idx) => (
                  <div key={stop.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center text-sm font-bold">{idx + 1}</div>
                      {idx < itineraryStops.length - 1 && <div className="w-0.5 h-full bg-gray-200 mt-1" />}
                    </div>
                    <div className="pb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 text-sm">{stop.title}</span>
                        {stop.timeLabel && <span className="text-xs text-gray-400">{stop.timeLabel}</span>}
                      </div>
                      {stop.location && <p className="text-xs text-gray-500 mb-1"><MapPin className="w-3 h-3 inline mr-1" />{stop.location}</p>}
                      {stop.description && <p className="text-xs text-gray-600">{stop.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inclusions / Exclusions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {trip.includes?.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-900 mb-2">Inclusions</h2>
                <ul className="space-y-1">
                  {trip.includes.map((item, i) => <li key={i} className="text-xs text-gray-600 flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span>{item}</li>)}
                </ul>
              </div>
            )}
            {trip.excludes?.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-900 mb-2">Exclusions</h2>
                <ul className="space-y-1">
                  {trip.excludes.map((item, i) => <li key={i} className="text-xs text-gray-600 flex items-start gap-2"><span className="text-red-400 mt-0.5">✕</span>{item}</li>)}
                </ul>
              </div>
            )}
          </div>

          {/* Cancellation Policy */}
          <div className="bg-red-50 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-red-800 mb-3">Cancellation Policy</h2>
            <ul className="space-y-1 text-xs text-red-700">
              <li>Free cancellation if cancelled more than 24 hours before the trip</li>
              <li>50% fee if cancelled 12–24 hours before</li>
              <li>75% fee if cancelled 3–12 hours before</li>
              <li>No refund if cancelled less than 2 hours before</li>
            </ul>
          </div>
        </div>

        {/* Booking sidebar */}
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm sticky top-4">
            <p className="text-2xl font-bold text-gray-900 mb-1">{fmt(trip.adultPriceCents)} <span className="text-sm font-normal text-gray-400">/ adult</span></p>

            {/* Pax selectors */}
            <div className="space-y-3 mt-4">
              {[{ label: 'Adults', value: adults, set: setAdults, min: 1 }, { label: 'Children', value: children, set: setChildren, min: 0 }].map(({ label, value, set, min }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{label}</span>
                  <div className="flex items-center gap-3">
                    <button onClick={() => set(Math.max(min, value - 1))} className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"><Minus className="w-3 h-3" /></button>
                    <span className="w-6 text-center text-sm font-medium">{value}</span>
                    <button onClick={() => set(Math.min(trip.maxPax, value + 1))} className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"><Plus className="w-3 h-3" /></button>
                  </div>
                </div>
              ))}
            </div>

            {/* Service date */}
            <div className="mt-4">
              <label className="text-sm text-gray-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-brand-primary" /> Service date
              </label>
              <input
                type="date"
                value={date}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            {/* Markup */}
            <div className="mt-4">
              <label className="text-sm text-gray-700 mb-1 block">Markup %</label>
              <input
                type="number"
                min={0}
                max={100}
                value={markup}
                onChange={e => setMarkup(Math.min(100, Math.max(0, Number(e.target.value))))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            {/* Summary */}
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600"><span>Net cost ({pax} pax)</span><span>{fmt(net)}</span></div>
              <div className="flex justify-between text-gray-600"><span>VAT 15%</span><span>{fmt(vat)}</span></div>
              {markupAmt > 0 && <div className="flex justify-between text-gray-600"><span>Markup {markup}%</span><span>{fmt(markupAmt)}</span></div>}
              <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100"><span>Grand Total</span><span>{fmt(total)}</span></div>
            </div>

            {addError && (
              <p className="mt-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{addError}</p>
            )}

            <button
              onClick={addToCart}
              disabled={adding}
              className="w-full mt-5 bg-brand-primary text-white py-3 rounded-xl font-semibold hover:bg-brand-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {!user ? (
                <><LogIn className="w-4 h-4" /> Login to Book</>
              ) : adding ? 'Adding…'
                : trip.availabilityMode === 'on_request' ? 'Request Booking' : 'Add to Cart'}
            </button>

            {/* Pickup zones */}
            {pickupZones.length > 0 && (
              <div className="mt-5 pt-4 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-700 mb-3">Pickup Zones</p>
                <div className="space-y-2">
                  {pickupZones.map(z => (
                    <div key={z.id} className="text-xs text-gray-600">
                      <p className="font-medium">{z.zoneName}</p>
                      {z.hotelName && <p className="text-gray-400">{z.hotelName}</p>}
                      {z.pickupTimeFrom && <p className="text-gray-400">{z.pickupTimeFrom}{z.pickupTimeTo ? ` – ${z.pickupTimeTo}` : ''}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
