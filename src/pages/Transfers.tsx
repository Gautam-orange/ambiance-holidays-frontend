import React, { useEffect, useState, useCallback } from 'react';
import { MapPin, Clock, CheckCircle2, ShoppingCart, Check, TrendingUp, Users, Loader2, Info, Briefcase, Wind, Zap, LogIn, Plus, X, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { addToCart } from '../api/bookings';
import { useAuth } from '../contexts/AuthContext';
import PlacesAutocomplete from '../components/PlacesAutocomplete';
import carsApi, { Car } from '../api/cars';
import { geocodeOne, haversineKm } from '../lib/geocode';

type TripType = 'ONE_WAY' | 'ROUND_TRIP' | 'ARRIVAL' | 'DEPARTURE' | 'HOURLY' | 'POINT_TO_POINT' | 'MULTI_TRIP';

const TRIP_TYPES: { key: TripType; label: string }[] = [
  { key: 'ONE_WAY',        label: 'One Way' },
  { key: 'ROUND_TRIP',     label: 'Round Trip' },
  { key: 'ARRIVAL',        label: 'Arrival' },
  { key: 'DEPARTURE',      label: 'Departure' },
  { key: 'MULTI_TRIP',     label: 'Multi-Trip' },
];

const ADULT_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const today = new Date().toISOString().split('T')[0];

/** Distance is computed client-side; per-car price comes from each car's own PER_KM bands. */
interface DistanceInfo {
  distanceKm: number;
  found: boolean;
}

/** Find the matching PER_KM band for the given distance and return its price. Null = no band covers it. */
function quoteCarFromBands(car: Car, distanceKm: number): number | null {
  const km = Math.max(0, distanceKm);
  const band = car.rates.find(r => {
    if (r.period !== 'PER_KM') return false;
    const from = r.kmFrom ?? 0;
    const to = r.kmTo ?? Number.MAX_SAFE_INTEGER;
    return km >= from && km <= to;
  });
  return band ? band.amountCents : null;
}

const CATEGORY_LABEL: Record<string, string> = {
  ECONOMY: 'Economy',
  STANDARD: 'Standard',
  PREMIUM: 'Premium',
  LUXURY: 'Luxury',
  SUV: 'SUV',
  MINIVAN: 'Minivan',
};

export default function Transfers() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isAgent = user?.role === 'B2B_AGENT';

  // Trip type
  const [tripType, setTripType] = useState<TripType>(() =>
    (searchParams.get('tripType') as TripType) ?? 'ONE_WAY'
  );

  // Location fields (standard trips)
  const [from, setFrom] = useState(() => searchParams.get('from') ?? '');
  const [to, setTo]     = useState(() => searchParams.get('to') ?? '');

  // Multi-trip: array of stops (min 2)
  const [multiStops, setMultiStops] = useState<string[]>(['', '']);
  const addStop    = () => setMultiStops(s => [...s, '']);
  const removeStop = (i: number) => setMultiStops(s => s.length > 2 ? s.filter((_, idx) => idx !== i) : s);
  const updateStop = (i: number, val: string) => setMultiStops(s => s.map((v, idx) => idx === i ? val : v));

  // Search fields
  const [adults,     setAdults]     = useState(() => Number(searchParams.get('adults') ?? 2));
  const [date,       setDate]       = useState(() => searchParams.get('date') ?? '');
  const [time,       setTime]       = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [hours,      setHours]      = useState('');

  // Agent markup
  const [markup, setMarkup] = useState('');

  // Distance (price comes from each car's own PER_KM bands)
  const [quote,      setQuote]      = useState<DistanceInfo | null>(null);
  const [quoting,    setQuoting]    = useState(false);
  const [quoteError, setQuoteError] = useState('');

  // Cars
  const [cars,          setCars]          = useState<Car[]>([]);
  const [carsLoading,   setCarsLoading]   = useState(true);
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);

  // Vehicle filters (Step 2 sidebar)
  const [filterCategories, setFilterCategories] = useState<Set<string>>(new Set());
  const [filterMinPax,     setFilterMinPax]     = useState<number | null>(null);
  const [filterMinLuggage, setFilterMinLuggage] = useState<number | null>(null);
  const [filterAcOnly,     setFilterAcOnly]     = useState(false);
  const [filterAutoOnly,   setFilterAutoOnly]   = useState(false);

  // Cart
  const [adding, setAdding] = useState(false);
  const [added,  setAdded]  = useState(false);

  // Clamp adults down if the chosen car can't seat the current selection.
  useEffect(() => {
    if (selectedCarId) {
      const c = cars.find(x => x.id === selectedCarId);
      if (c && adults > c.passengerCapacity) {
        setAdults(c.passengerCapacity);
      }
    }
  }, [selectedCarId, adults, cars]);

  // Load all available transfer-eligible cars on mount.
  // The catalog list returns RENTAL/BOTH today; we filter client-side to
  // those with at least one PER_KM band (= priced for transfers).
  useEffect(() => {
    setCarsLoading(true);
    carsApi.catalogList({ size: 50 })
      .then(r => {
        const items: Car[] = r.data.data.items;
        const transferCars = items.filter(c =>
          (c.usageType === 'TRANSFER' || c.usageType === 'BOTH')
          && c.rates.some(rt => rt.period === 'PER_KM')
        );
        setCars(transferCars);
      })
      .catch(() => {})
      .finally(() => setCarsLoading(false));
  }, []);

  // Compute the trip distance once locations are filled. The price for each
  // car is then derived locally from that car's PER_KM bands.
  const fetchQuote = useCallback(async (fromVal: string, toVal: string) => {
    if (!fromVal || !toVal) { setQuote(null); return; }
    setQuoting(true);
    setQuoteError('');
    try {
      const [coordFrom, coordTo] = await Promise.all([geocodeOne(fromVal), geocodeOne(toVal)]);
      if (!coordFrom || !coordTo) {
        setQuoteError('Could not locate one or both addresses. Please be more specific.');
        setQuote(null);
        return;
      }
      const distKm = Math.round(haversineKm(
        parseFloat(coordFrom.lat), parseFloat(coordFrom.lon),
        parseFloat(coordTo.lat),   parseFloat(coordTo.lon)
      ));
      setQuote({ distanceKm: distKm, found: true });
    } catch {
      setQuoteError('Distance calculation failed. Please try again.');
    } finally {
      setQuoting(false);
    }
  }, []);

  const fetchMultiQuote = useCallback(async (stops: string[]) => {
    const filled = stops.filter(s => s.trim());
    if (filled.length < 2) { setQuote(null); return; }
    setQuoting(true);
    setQuoteError('');
    try {
      const coords = await Promise.all(filled.map(s => geocodeOne(s)));
      if (coords.some(c => !c)) {
        setQuoteError('Could not locate one or more stops. Please be more specific.');
        setQuote(null);
        return;
      }
      let totalKm = 0;
      for (let i = 0; i < coords.length - 1; i++) {
        totalKm += haversineKm(
          parseFloat(coords[i]!.lat), parseFloat(coords[i]!.lon),
          parseFloat(coords[i + 1]!.lat), parseFloat(coords[i + 1]!.lon)
        );
      }
      setQuote({ distanceKm: Math.round(totalKm), found: true });
    } catch {
      setQuoteError('Distance calculation failed. Please try again.');
    } finally {
      setQuoting(false);
    }
  }, []);

  // Debounced quote trigger
  useEffect(() => {
    if (tripType === 'HOURLY') return;
    if (tripType === 'MULTI_TRIP') {
      const t = setTimeout(() => fetchMultiQuote(multiStops), 700);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => { if (from && to) fetchQuote(from, to); }, 600);
    return () => clearTimeout(t);
  }, [from, to, tripType, multiStops, fetchQuote, fetchMultiQuote]);

  const markupPct    = parseFloat(markup) || 0;
  const fmt = (cents: number) => `$${(cents / 100).toLocaleString('en-US')}`;

  const selectedCar = cars.find(c => c.id === selectedCarId) ?? null;
  const selectedCarPrice = selectedCar && quote ? quoteCarFromBands(selectedCar, quote.distanceKm) : null;
  const cheapestPrice = quote
    ? cars
        .map(c => quoteCarFromBands(c, quote.distanceKm))
        .filter((p): p is number => p != null)
        .sort((a, b) => a - b)[0] ?? null
    : null;
  const basePrice    = selectedCarPrice ?? cheapestPrice ?? 0;
  const markupAmt    = Math.round(basePrice * markupPct / 100);
  const customerPrice = basePrice + markupAmt;

  const handleBook = async () => {
    if (!user) {
      navigate('/auth/login', { state: { from: location } });
      return;
    }
    if (!quote || !quote.found) {
      alert('Please enter valid From and To locations to get a price.');
      return;
    }
    if (!selectedCarId || !selectedCar) {
      alert('Please select a vehicle below.');
      document.getElementById('vehicle-select-section')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (selectedCarPrice == null) {
      alert(`This car has no rate covering ${quote.distanceKm} km. Please pick another vehicle.`);
      return;
    }
    if (adults > selectedCar.passengerCapacity) {
      alert(`${selectedCar.name} seats only ${selectedCar.passengerCapacity}. Please reduce the adult count or pick a larger vehicle.`);
      return;
    }
    if (!date) { alert('Please select a date.'); return; }
    setAdding(true);
    try {
      await addToCart({
        itemType: 'CAR_TRANSFER',
        // refId is now the chosen Car id. Backend re-derives the price from
        // the matching PER_KM band on that car using options.distanceKm.
        refId: selectedCarId,
        quantity: 1,
        options: {
          unitPriceCents: selectedCarPrice,
          pickupLocation: tripType === 'MULTI_TRIP' ? multiStops[0] : from,
          dropoffLocation: tripType === 'MULTI_TRIP' ? multiStops[multiStops.length - 1] : to,
          stops: tripType === 'MULTI_TRIP' ? multiStops.filter(Boolean) : undefined,
          tripType,
          adults,
          date,
          time,
          distanceKm: quote.distanceKm,
          carId: selectedCarId,
          carName: selectedCar.name,
          carCategory: selectedCar.category,
          markupPct: markupPct > 0 ? markupPct : undefined,
        },
      });
      setAdded(true);
      setTimeout(() => navigate('/cart'), 800);
    } catch (e: any) {
      alert(e?.response?.data?.error?.message ?? 'Could not add to cart');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Hero / Search */}
      <div className="bg-brand-900 text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/pexels-ilyalisauskas-8278835.jpg" alt="Mauritius coast" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-900/90 to-brand-900/40" />
        </div>

        <div className="max-w-7xl mx-auto px-8 relative z-10">
          <div className="mb-8">
            <h1 className="text-5xl font-display font-bold leading-tight">
              Island <span className="text-brand-primary">Transfers</span>
            </h1>
            <p className="text-white/60 max-w-md font-medium text-lg leading-relaxed mt-3">
              Punctual, professional, comfortable. Fixed price calculated by distance — no hidden fees.
            </p>
          </div>

          {/* Trip type pill tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {TRIP_TYPES.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => { setTripType(key); setQuote(null); }}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                  tripType === key
                    ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/30'
                    : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Search / Booking Form */}
          <div className="bg-white rounded-3xl p-6 shadow-2xl">

            {/* Multi-Trip stops — full-width above the grid */}
            {tripType === 'MULTI_TRIP' && (
              <div className="mb-4 space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-brand-primary" /> Trip Stops *
                </label>
                {multiStops.map((stop, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 w-16 shrink-0">
                      {idx === 0 ? 'Start' : idx === multiStops.length - 1 ? 'End' : `Stop ${idx}`}
                    </span>
                    <div className="flex-1 flex items-center p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <PlacesAutocomplete
                        value={stop}
                        onChange={val => updateStop(idx, val)}
                        placeholder={idx === 0 ? 'Pickup location…' : 'Next destination…'}
                        className="bg-transparent border-none outline-none text-xs font-bold text-slate-700 w-full pl-6"
                        showIcon
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeStop(idx)}
                      disabled={multiStops.length <= 2}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-30"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addStop}
                  className="flex items-center gap-2 text-brand-primary text-xs font-bold hover:underline mt-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Stop
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* From + To (hidden for Multi-Trip and Hourly) */}
              {tripType !== 'MULTI_TRIP' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-brand-primary" /> From Location *
                  </label>
                  <div className="flex items-center p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <PlacesAutocomplete value={from} onChange={setFrom} placeholder="Airport, hotel, city…"
                      className="bg-transparent border-none outline-none text-xs font-bold text-slate-700 w-full pl-6" showIcon />
                  </div>
                </div>
              )}

              {/* To (hidden for Hourly and Multi-Trip) */}
              {tripType !== 'MULTI_TRIP' && (tripType !== 'HOURLY' ? (
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-brand-primary" /> To Location *
                  </label>
                  <div className="flex items-center p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <PlacesAutocomplete value={to} onChange={setTo} placeholder="Destination…"
                      className="bg-transparent border-none outline-none text-xs font-bold text-slate-700 w-full pl-6" showIcon />
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                    <Clock className="w-3 h-3 text-brand-primary" /> Duration (hours) *
                  </label>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <select value={hours} onChange={e => setHours(e.target.value)}
                      className="bg-transparent border-none outline-none text-xs font-bold text-slate-700 w-full">
                      <option value="">Select hours</option>
                      {[2, 3, 4, 5, 6, 7, 8].map(h => <option key={h} value={h}>{h} hours</option>)}
                    </select>
                  </div>
                </div>
              ))}

              {/* Adults — capped at the selected car's capacity (or 10 if none picked yet) */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                  <Users className="w-3 h-3 text-brand-primary" /> Adult Count
                </label>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <select value={adults} onChange={e => setAdults(Number(e.target.value))}
                    className="bg-transparent border-none outline-none text-xs font-bold text-slate-700 w-full">
                    {ADULT_OPTIONS
                      .filter(n => !selectedCar || n <= selectedCar.passengerCapacity)
                      .map(n => <option key={n} value={n}>{n} Adult{n > 1 ? 's' : ''}</option>)}
                  </select>
                </div>
                {selectedCar && (
                  <p className="text-[10px] text-slate-400">
                    Max {selectedCar.passengerCapacity} for {selectedCar.name}
                  </p>
                )}
              </div>

              {/* Date */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Date *</label>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <input type="date" value={date} min={today} onChange={e => setDate(e.target.value)}
                    className="bg-transparent border-none outline-none text-xs font-bold text-slate-700 w-full" />
                </div>
              </div>

              {/* Return date */}
              {(tripType === 'ROUND_TRIP' || tripType === 'MULTI_TRIP') && (
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Return Date</label>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <input type="date" value={returnDate} min={date || today} onChange={e => setReturnDate(e.target.value)}
                      className="bg-transparent border-none outline-none text-xs font-bold text-slate-700 w-full" />
                  </div>
                </div>
              )}

              {/* Time */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Pickup Time</label>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <input type="time" value={time} onChange={e => setTime(e.target.value)}
                    className="bg-transparent border-none outline-none text-xs font-bold text-slate-700 w-full" />
                </div>
              </div>

              {/* Agent markup */}
              {isAgent && (
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-amber-500 tracking-wider flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Your Markup (%)
                  </label>
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                    <input type="number" min="0" max="100" step="0.5" placeholder="0" value={markup}
                      onChange={e => setMarkup(e.target.value)}
                      className="bg-transparent border-none outline-none text-xs font-bold text-amber-700 w-full" />
                  </div>
                </div>
              )}
            </div>

            {/* Price quote + Book button */}
            <div className="mt-5 flex flex-col md:flex-row gap-4 items-start md:items-center border-t border-slate-100 pt-5">
              <div className="flex-1">
                <AnimatePresence mode="wait">
                  {quoting && (
                    <motion.div key="quoting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="flex items-center gap-2 text-slate-500 text-sm">
                      <Loader2 className="w-4 h-4 animate-spin text-brand-primary" />
                      Calculating distance and price…
                    </motion.div>
                  )}
                  {!quoting && quoteError && (
                    <motion.div key="err" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="flex items-center gap-2 text-red-500 text-sm">
                      <Info className="w-4 h-4" /> {quoteError}
                    </motion.div>
                  )}
                  {!quoting && !quoteError && quote && quote.found && (
                    <motion.div key="price" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="space-y-1">
                      <div className="flex items-baseline gap-3 flex-wrap">
                        <span className="text-3xl font-display font-bold text-brand-primary">
                          {selectedCarPrice != null ? fmt(selectedCarPrice) : cheapestPrice != null ? `from ${fmt(cheapestPrice)}` : '—'}
                        </span>
                        <span className="text-slate-400 text-sm">
                          · {quote.distanceKm} km{selectedCar && ` · ${selectedCar.name}`}
                        </span>
                      </div>
                      {isAgent && markupPct > 0 && (
                        <div className="flex gap-4 text-sm">
                          <span className="text-slate-500">Ambiance charges you: <strong>{fmt(basePrice)}</strong></span>
                          <span className="text-amber-600 font-bold">You charge customer: {fmt(customerPrice)}</span>
                        </div>
                      )}
                      {selectedCar && (
                        <p className="text-xs text-brand-primary font-semibold">
                          Vehicle: {selectedCar.name}
                        </p>
                      )}
                    </motion.div>
                  )}
                  {!quoting && !quoteError && quote && !quote.found && (
                    <motion.div key="noprice" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="text-slate-500 text-sm flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      Distance is outside our standard pricing tiers.{' '}
                      <a href="mailto:info@ambianceholidays.com" className="text-brand-primary underline">Request a quote</a>
                    </motion.div>
                  )}
                  {!quoting && !quoteError && !quote && (
                    <motion.div key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="text-slate-400 text-sm">
                      Enter pickup and drop-off locations to see instant pricing.
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={handleBook}
                disabled={adding || (!!user && (!quote?.found || !selectedCarId))}
                className="bg-brand-primary text-white px-10 py-3.5 rounded-2xl font-bold shadow-lg shadow-brand-primary/20 hover:bg-brand-secondary transition-all disabled:opacity-50 flex items-center gap-2 shrink-0"
              >
                {!user    ? <><LogIn className="w-4 h-4" /> Login to Book</>
                 : added   ? <><Check className="w-4 h-4" /> Added to Cart</>
                 : adding  ? <><Loader2 className="w-4 h-4 animate-spin" /> Adding…</>
                 : <><ShoppingCart className="w-4 h-4" /> Book Transfer</>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle Selection */}
      <div id="vehicle-select-section" className="max-w-7xl mx-auto px-8 py-12">
        <div className="mb-8">
          <span className="text-brand-primary font-bold tracking-[0.2em] uppercase text-xs">Step 2</span>
          <h2 className="text-2xl font-display font-bold text-brand-primary mt-1">Select Your Vehicle</h2>
          <p className="text-slate-500 text-sm mt-1">
            {quote?.found
              ? `Each vehicle below is priced for your ${quote.distanceKm} km transfer based on its own rate bands. Pick one to confirm.`
              : 'Enter pickup and drop-off locations above to see the price for each vehicle.'}
          </p>
        </div>

        {(() => {
          const filteredCars = cars.filter(c => {
            if (filterCategories.size > 0 && !filterCategories.has(c.category)) return false;
            if (filterMinPax != null && c.passengerCapacity < filterMinPax) return false;
            if (filterMinLuggage != null && (c.luggageCapacity ?? 0) < filterMinLuggage) return false;
            if (filterAcOnly && !c.hasAc) return false;
            if (filterAutoOnly && !c.automatic) return false;
            return true;
          });
          const toggleCategory = (cat: string) => setFilterCategories(prev => {
            const n = new Set(prev); n.has(cat) ? n.delete(cat) : n.add(cat); return n;
          });
          const clearFilters = () => {
            setFilterCategories(new Set());
            setFilterMinPax(null);
            setFilterMinLuggage(null);
            setFilterAcOnly(false);
            setFilterAutoOnly(false);
          };
          const FilterPanel = (
            <div className="space-y-8 lg:sticky lg:top-28 h-fit bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="font-bold text-brand-primary">Filters</h3>
                <button onClick={clearFilters} className="text-[10px] font-bold uppercase tracking-widest text-brand-primary underline underline-offset-4">
                  Clear
                </button>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Category</h4>
                {Object.entries(CATEGORY_LABEL).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer text-sm text-slate-600">
                    <input type="checkbox" className="accent-brand-primary w-4 h-4"
                      checked={filterCategories.has(key)} onChange={() => toggleCategory(key)} />
                    {label}
                  </label>
                ))}
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Min Passengers</h4>
                {[null, 2, 4, 6, 8].map(n => (
                  <label key={n ?? 'any'} className="flex items-center gap-2 cursor-pointer text-sm text-slate-600">
                    <input type="radio" name="tx-min-pax" className="accent-brand-primary w-4 h-4"
                      checked={filterMinPax === n} onChange={() => setFilterMinPax(n)} />
                    {n == null ? 'Any' : `${n}+`}
                  </label>
                ))}
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Min Luggage</h4>
                {[null, 2, 4, 6].map(n => (
                  <label key={n ?? 'any'} className="flex items-center gap-2 cursor-pointer text-sm text-slate-600">
                    <input type="radio" name="tx-min-lug" className="accent-brand-primary w-4 h-4"
                      checked={filterMinLuggage === n} onChange={() => setFilterMinLuggage(n)} />
                    {n == null ? 'Any' : `${n}+ bags`}
                  </label>
                ))}
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Features</h4>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-600">
                  <input type="checkbox" className="accent-brand-primary w-4 h-4"
                    checked={filterAcOnly} onChange={() => setFilterAcOnly(v => !v)} />
                  Air Conditioning
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-600">
                  <input type="checkbox" className="accent-brand-primary w-4 h-4"
                    checked={filterAutoOnly} onChange={() => setFilterAutoOnly(v => !v)} />
                  Automatic
                </label>
              </div>
            </div>
          );

          return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div>{FilterPanel}</div>
          <div className="lg:col-span-3">
        {carsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl h-56 animate-pulse border border-slate-100" />
            ))}
          </div>
        ) : filteredCars.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="text-lg font-semibold">No vehicles match your filters</p>
            <button onClick={clearFilters} className="mt-3 text-brand-primary underline text-sm font-medium">Clear filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredCars.map(car => {
              const isSelected = selectedCarId === car.id;
              const carPrice = quote?.found ? quoteCarFromBands(car, quote.distanceKm) : null;
              const matchingBand = car.rates.find(r => {
                if (r.period !== 'PER_KM' || !quote?.found) return false;
                const from = r.kmFrom ?? 0;
                const to = r.kmTo ?? Number.MAX_SAFE_INTEGER;
                return quote.distanceKm >= from && quote.distanceKm <= to;
              });
              return (
                <motion.div
                  key={car.id}
                  whileHover={{ y: -4 }}
                  onClick={() => setSelectedCarId(isSelected ? null : car.id)}
                  className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden cursor-pointer transition-all ${
                    isSelected
                      ? 'border-brand-primary shadow-brand-primary/20 shadow-lg'
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  {/* Car image */}
                  <div className="relative h-44 bg-slate-100 overflow-hidden">
                    {car.coverImageUrl ? (
                      <img src={car.coverImageUrl} alt={car.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                        <span className="text-slate-300 text-4xl">🚗</span>
                      </div>
                    )}
                    {/* Category badge */}
                    <div className="absolute top-3 left-3">
                      <span className="bg-brand-primary/80 text-white text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm">
                        {CATEGORY_LABEL[car.category] ?? car.category}
                      </span>
                    </div>
                    {/* Selected checkmark */}
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-7 h-7 bg-brand-primary rounded-full flex items-center justify-center shadow-lg">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Car info */}
                  <div className="p-5">
                    <h3 className="font-display font-bold text-slate-800 text-base leading-tight">{car.name}</h3>

                    {/* Specs row */}
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-brand-primary" />
                        {car.passengerCapacity} pax
                      </span>
                      {car.luggageCapacity && (
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3.5 h-3.5 text-brand-primary" />
                          {car.luggageCapacity} bags
                        </span>
                      )}
                      {car.hasAc && (
                        <span className="flex items-center gap-1">
                          <Wind className="w-3.5 h-3.5 text-brand-primary" />
                          AC
                        </span>
                      )}
                      {car.automatic && (
                        <span className="flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5 text-brand-primary" />
                          Auto
                        </span>
                      )}
                    </div>

                    {/* Price + select button */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                      <div>
                        {carPrice != null && matchingBand ? (
                          <>
                            <p className="text-2xl font-display font-bold text-brand-primary">{fmt(carPrice)}</p>
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                              {matchingBand.kmFrom ?? 0}–{matchingBand.kmTo ?? '∞'} km band
                            </p>
                          </>
                        ) : quote?.found ? (
                          <p className="text-xs text-amber-600 italic">No rate covers {quote.distanceKm} km</p>
                        ) : (
                          <p className="text-xs text-slate-400 italic">Enter locations for price</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/car-rental/${car.id}`}
                          onClick={e => e.stopPropagation()}
                          className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-brand-primary hover:bg-brand-primary/5 transition-all border border-slate-200 hover:border-brand-primary/30"
                        >
                          <Eye className="w-3 h-3" /> Details
                        </Link>
                        <button
                          onClick={e => { e.stopPropagation(); setSelectedCarId(isSelected ? null : car.id); }}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-brand-primary text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-brand-primary/10 hover:text-brand-primary'
                          }`}
                        >
                          {isSelected ? 'Selected ✓' : 'Select'}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
          </div>
        </div>
          );
        })()}

        {/* Includes */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: CheckCircle2, label: 'Meet & Greet', sub: 'Driver waits at arrivals hall with your name' },
            { icon: CheckCircle2, label: 'Flight Monitoring', sub: "We track your flight so you're never left waiting" },
            { icon: CheckCircle2, label: 'Fixed Price', sub: 'No meter, no surge — price locked at booking' },
          ].map(f => (
            <div key={f.label} className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-slate-100">
              <f.icon className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-800 text-sm">{f.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{f.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
