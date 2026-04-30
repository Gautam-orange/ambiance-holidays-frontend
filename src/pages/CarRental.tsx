import React, { useState, useEffect, useCallback } from 'react';
import { Users, CheckCircle2, Briefcase } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import carsApi, { Car, CarCategory, formatPrice, getDailyRate } from '../api/cars';
import CarRentalSearchWidget from '../components/CarRentalSearchWidget';

const CATEGORIES: CarCategory[] = ['LUXURY', 'PREMIUM', 'SUV', 'STANDARD', 'ECONOMY', 'MINIVAN'];
const PAX_OPTIONS = [3, 4, 7];
const LUGGAGE_OPTIONS = [3, 4, 7];

function CheckOption({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-600">
      <input type="checkbox" checked={checked} onChange={onChange} className="accent-brand-primary w-4 h-4" />
      {label}
    </label>
  );
}

export default function CarRental() {
  const [searchParams] = useSearchParams();
  const [cars, setCars] = useState<Car[]>([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<Set<CarCategory>>(new Set());
  const [paxOptions, setPaxOptions] = useState<Set<number>>(new Set());
  const [luggageOptions, setLuggageOptions] = useState<Set<number>>(new Set());
  const [markup, setMarkup] = useState('');
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const heroPickup = searchParams.get('from') ?? '';
  const heroDropoff = searchParams.get('to') ?? '';

  const minPax = paxOptions.size > 0 ? Math.min(...Array.from(paxOptions)) : undefined;
  const category = categories.size === 1 ? Array.from(categories)[0] : undefined;

  const fetchCars = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await carsApi.catalogList({
        page,
        size: 12,
        category,
        minPax,
      });
      setCars(res.data.data.items);
      setTotal(res.data.data.meta.total);
    } finally {
      setIsLoading(false);
    }
  }, [page, category, minPax]);

  useEffect(() => { fetchCars(); }, [fetchCars]);
  useEffect(() => { setPage(0); }, [categories, paxOptions, luggageOptions]);

  const toggleSet = <T,>(set: Set<T>, val: T, setter: (s: Set<T>) => void) => {
    const next = new Set(set);
    next.has(val) ? next.delete(val) : next.add(val);
    setter(next);
  };

  const clearFilters = () => {
    setCategories(new Set());
    setPaxOptions(new Set());
    setLuggageOptions(new Set());
    setMarkup('');
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
        <CheckOption label="All" checked={categories.size === 0} onChange={() => setCategories(new Set())} />
        {CATEGORIES.map(c => (
          <CheckOption key={c} label={c.charAt(0) + c.slice(1).toLowerCase()} checked={categories.has(c)}
            onChange={() => toggleSet(categories, c, setCategories)} />
        ))}
      </div>

      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Max Passenger</h4>
        {PAX_OPTIONS.map(n => (
          <CheckOption key={n} label={`${n}+`} checked={paxOptions.has(n)}
            onChange={() => toggleSet(paxOptions, n, setPaxOptions)} />
        ))}
      </div>

      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Luggage Capacity</h4>
        {LUGGAGE_OPTIONS.map(n => (
          <CheckOption key={n} label={`${n}+`} checked={luggageOptions.has(n)}
            onChange={() => toggleSet(luggageOptions, n, setLuggageOptions)} />
        ))}
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Mark Up (%)</h4>
        <input
          type="number" min="0" max="100" step="0.5"
          placeholder="e.g. 10"
          value={markup}
          onChange={e => setMarkup(e.target.value)}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-primary"
        />
      </div>
    </div>
  );

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Hero */}
      <div className="bg-brand-900 text-white pt-20 pb-32 relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/pexels-vinixhc-28937727.jpg" alt="Mauritius" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-900/90 to-brand-900/40" />
        </div>
        <div className="max-w-7xl mx-auto px-8 relative z-10 space-y-10">
          <div className="space-y-4 max-w-2xl">
            <h1 className="text-5xl font-display font-bold leading-tight">Luxury <span className="text-brand-primary italic">Rentals</span></h1>
            <p className="text-white/70 font-medium text-lg leading-relaxed">Drive across the island in style. Choose your dates, locations and party size — we handle the rest.</p>
          </div>
        </div>
        {/* Search widget overlaps the hero/content boundary so it sits prominently */}
        <div className="max-w-7xl mx-auto px-8 relative z-20 -mb-24">
          <CarRentalSearchWidget
            initial={{
              pickup: heroPickup,
              dropoff: heroDropoff,
              adults: Number(searchParams.get('adults')) || 2,
              pickupDate: searchParams.get('date') ?? '',
              pickupTime: searchParams.get('time') ?? '',
              dropoffDate: searchParams.get('dropoffDate') ?? '',
              dropoffTime: searchParams.get('dropoffTime') ?? '',
            }}
          />
        </div>
      </div>

      {/* Spacer to clear the overlapping search widget */}
      <div className="h-24" />

      {/* Content — cars LEFT, filters RIGHT */}
      <div className="max-w-7xl mx-auto px-8 py-16 grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* Car grid — 3 cols */}
        <div className="lg:col-span-3 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-display font-bold text-brand-primary">
              Available Cars
              <span className="text-slate-400 font-sans font-medium text-lg ml-2">({total})</span>
            </h2>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-3xl overflow-hidden border border-slate-100 animate-pulse">
                  <div className="h-48 bg-slate-200" />
                  <div className="p-6 space-y-3">
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                    <div className="h-10 bg-slate-100 rounded mt-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : cars.length === 0 ? (
            <div className="text-center py-24 text-slate-400">
              <p className="font-bold text-lg">No cars match your filters.</p>
              <button onClick={clearFilters} className="mt-4 text-brand-primary underline text-sm font-medium">
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {cars.map(car => {
                const daily = getDailyRate(car);
                const markupPct = parseFloat(markup) || 0;
                const basePrice = daily ? daily.amountCents : 0;
                const displayPrice = daily ? Math.round(basePrice * (1 + markupPct / 100)) : null;
                return (
                  <motion.div key={car.id} whileHover={{ y: -5 }}
                    className="bg-white rounded-3xl overflow-hidden shadow-xl shadow-slate-200/40 border border-slate-100 group flex flex-col">
                    <div className="h-48 relative overflow-hidden bg-slate-100">
                      {car.coverImageUrl
                        ? <img src={car.coverImageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        : <div className="w-full h-full flex items-center justify-center text-slate-300 text-4xl font-bold">{car.name[0]}</div>}
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-brand-primary uppercase tracking-wider shadow-sm">
                        {car.category}
                      </div>
                    </div>
                    <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-display font-bold text-slate-900 text-lg leading-tight">{car.name}</h3>
                          <span className="text-sm font-bold text-slate-400 font-mono italic">{car.year}</span>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <div className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {car.passengerCapacity} PAX</div>
                          {car.luggageCapacity != null && (
                            <div className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" /> {car.luggageCapacity} bags</div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-brand-primary" />
                            {car.automatic ? 'Auto' : 'Manual'}
                          </div>
                        </div>
                      </div>
                      <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Per Day</p>
                          <p className="text-xl font-display font-bold text-brand-primary">
                            {displayPrice != null ? formatPrice(displayPrice) : 'POA'}
                          </p>
                          {markupPct > 0 && daily && (
                            <p className="text-[10px] text-slate-400 line-through">{formatPrice(daily.amountCents)}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Link to={`/car-rental/${car.id}`}
                            className="px-4 py-3 rounded-2xl text-xs font-bold border border-slate-200 text-slate-600 hover:text-brand-primary hover:border-brand-primary/30 hover:bg-brand-primary/5 transition-all">
                            View Details
                          </Link>
                          <Link to={`/car-rental/${car.id}${(() => { const p = new URLSearchParams(); if (heroPickup) p.set('pickup', heroPickup); if (markup) p.set('markup', markup); const s = p.toString(); return s ? `?${s}` : ''; })()}`}>
                            <button className="bg-brand-primary text-white px-6 py-3 rounded-2xl text-xs font-bold hover:scale-[1.02] transform transition-transform shadow-lg shadow-brand-primary/20">
                              Book Now
                            </button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {total > 12 && (
            <div className="flex justify-center gap-2">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold disabled:opacity-40 hover:bg-slate-50">
                Previous
              </button>
              <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * 12 >= total}
                className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold disabled:opacity-40 hover:bg-slate-50">
                Next
              </button>
            </div>
          )}
        </div>

        {/* Filters — RIGHT */}
        <div>{FilterPanel}</div>
      </div>
    </div>
  );
}
