import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import {
  Users, Fuel, Calendar, ChevronRight, ShieldCheck,
  Headphones, Navigation, ArrowLeft, Minus, Plus,
  ShoppingCart, Check, Settings2, TrendingUp, ChevronLeft, Clock, LogIn, Star
} from 'lucide-react';
import carsApi, { Car, getDailyRate } from '../api/cars';
import { addToCart, formatMoney } from '../api/bookings';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import PlacesAutocomplete from '../components/PlacesAutocomplete';

const FEATURE_ICONS: Record<string, React.ElementType> = {
  'Professional Driver': Users,
  'Fuel Included': Fuel,
  'Insurance': ShieldCheck,
  'GPS Navigation': Navigation,
  '24/7 Support': Headphones,
  'Air Conditioning': Settings2,
};

/** Parse XSVC:Name:PriceCents entries from the includes array */
function parseExtraServices(includes: string[]): { name: string; priceCents: number }[] {
  return includes
    .filter(s => s.startsWith('XSVC:'))
    .map(s => {
      const parts = s.split(':');
      return {
        name: parts[1] ?? '',
        priceCents: parseInt(parts[2] ?? '0', 10) || 0,
      };
    })
    .filter(s => s.name.trim() !== '');
}

/** Strip XSVC entries — these are shown separately as selectable services */
function regularIncludes(includes: string[]): string[] {
  return includes.filter(s => !s.startsWith('XSVC:'));
}

export default function CarRentalDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const isAgent = user?.role === 'B2B_AGENT';
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [rentalDays, setRentalDays] = useState(1);
  const [pickupDate, setPickupDate] = useState(() => searchParams.get('date') ?? '');
  const [pickupTime, setPickupTime] = useState(() => searchParams.get('time') ?? '');
  const [dropoffDate, setDropoffDate] = useState('');
  const [dropoffTime, setDropoffTime] = useState('');
  const [adults, setAdults] = useState(() => Number(searchParams.get('adults') ?? 2));
  const [pickupLocation, setPickupLocation] = useState(() => searchParams.get('pickup') ?? '');
  const [dropoffLocation, setDropoffLocation] = useState(() => searchParams.get('dropoff') ?? '');
  const [markup, setMarkup] = useState(() => searchParams.get('markup') ?? '');
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [activeImg, setActiveImg] = useState(0);

  // Extra services selected by agent/user
  const [selectedExtras, setSelectedExtras] = useState<Set<string>>(new Set());

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    carsApi.catalogGet(id)
      .then(r => setCar(r.data.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  // Derived: parse extra services & regular includes
  const extraServices = useMemo(() => parseExtraServices(car?.includes ?? []), [car]);
  const standardIncludes = useMemo(() => regularIncludes(car?.includes ?? []), [car]);

  // Toggle an extra service on/off
  const toggleExtra = (name: string) => {
    setSelectedExtras(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  // Price calculations
  const dailyRate = car ? getDailyRate(car) : undefined;
  const perDay = dailyRate?.amountCents ?? 0;
  const baseSubtotal = perDay * rentalDays;
  const extrasTotalCents = extraServices
    .filter(s => selectedExtras.has(s.name))
    .reduce((acc, s) => acc + s.priceCents, 0);
  const subtotal = baseSubtotal + extrasTotalCents;
  const vat = Math.round(subtotal * 0.15);
  const total = subtotal + vat;
  const markupPct = parseFloat(markup) || 0;
  const markupAmt = Math.round(subtotal * markupPct / 100);
  const customerPrice = total + markupAmt;

  const handleAddToCart = async () => {
    if (!user) { navigate('/auth/login', { state: { from: location } }); return; }
    if (!car || !dailyRate) return;
    if (!pickupDate) { alert('Please select a pickup date'); return; }
    setAdding(true);

    const chosenExtras = extraServices.filter(s => selectedExtras.has(s.name));

    try {
      await addToCart({
        itemType: 'CAR_RENTAL',
        refId: car.id,
        // quantity=1, unitPrice = full pre-VAT subtotal so backend total is correct
        quantity: 1,
        options: {
          unitPriceCents: subtotal,          // full pre-VAT (base + extras)
          dailyRateCents: dailyRate.amountCents,
          rentalDays,
          adults,
          pickupLocation: pickupLocation || 'TBD',
          dropoffLocation: dropoffLocation || undefined,
          pickupDate,
          pickupTime: pickupTime || undefined,
          dropoffDate: dropoffDate || undefined,
          dropoffTime: dropoffTime || undefined,
          markupPct: markupPct > 0 ? markupPct : undefined,
          // Store selected extras for admin visibility
          selectedExtras: chosenExtras.length > 0
            ? chosenExtras.map(s => ({ name: s.name, priceCents: s.priceCents }))
            : undefined,
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 animate-pulse">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-8 bg-slate-200 rounded w-2/3" />
            <div className="aspect-video bg-slate-200 rounded-3xl" />
          </div>
          <div className="h-96 bg-slate-200 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (notFound || !car) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-slate-500">
        <p className="text-xl font-bold">Car not found</p>
        <Link to="/car-rental" className="text-brand-primary hover:underline flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Car Rental
        </Link>
      </div>
    );
  }

  const features = [
    ...standardIncludes,
    car.hasAc ? 'Air Conditioning' : null,
    car.automatic ? 'Automatic Transmission' : 'Manual Transmission',
  ].filter(Boolean) as string[];

  return (
    <div className="max-w-7xl mx-auto px-8 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400 mb-8">
        <Link to="/" className="hover:text-brand-primary">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <Link to="/car-rental" className="hover:text-brand-primary">Car Rental</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-900 font-medium">{car.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left: Car Info */}
        <div className="lg:col-span-2 space-y-10">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="bg-brand-primary/10 text-brand-primary text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                {car.category}
              </span>
              <span className={cn('text-xs font-bold px-3 py-1 rounded-full uppercase',
                car.status === 'ACTIVE' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400')}>
                {car.status}
              </span>
            </div>
            <h1 className="text-4xl font-display font-bold text-brand-primary">{car.name}</h1>
            <div className="flex flex-wrap items-center gap-6 mt-3 text-slate-500 text-sm">
              <span className="flex items-center gap-2"><Users className="w-4 h-4" />{car.passengerCapacity} Passengers</span>
              <span className="flex items-center gap-2"><Fuel className="w-4 h-4" />{car.fuelType ?? 'Petrol'}</span>
              <span className="flex items-center gap-2"><Calendar className="w-4 h-4" />{car.year} Model</span>
              {car.color && <span className="flex items-center gap-2">🎨 {car.color}</span>}
            </div>
          </div>

          {/* Image Gallery */}
          {(() => {
            const imgs = [car.coverImageUrl, ...(car.galleryUrls ?? [])].filter(Boolean) as string[];
            if (imgs.length === 0) return (
              <div className="aspect-video rounded-3xl bg-slate-100 flex items-center justify-center text-7xl font-bold text-slate-200">{car.name[0]}</div>
            );
            return (
              <div className="space-y-3">
                <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl bg-slate-100 group">
                  <img src={imgs[activeImg]} alt={car.name} className="w-full h-full object-cover transition-opacity duration-300" />
                  {imgs.length > 1 && (
                    <>
                      <button onClick={() => setActiveImg(i => (i - 1 + imgs.length) % imgs.length)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button onClick={() => setActiveImg(i => (i + 1) % imgs.length)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {imgs.map((_, i) => (
                          <button key={i} onClick={() => setActiveImg(i)}
                            className={cn('w-2 h-2 rounded-full transition-all', i === activeImg ? 'bg-white w-5' : 'bg-white/50')} />
                        ))}
                      </div>
                    </>
                  )}
                </div>
                {imgs.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {imgs.map((img, i) => (
                      <button key={i} onClick={() => setActiveImg(i)}
                        className={cn('shrink-0 w-20 h-14 rounded-xl overflow-hidden border-2 transition-all',
                          i === activeImg ? 'border-brand-primary' : 'border-transparent opacity-60 hover:opacity-100')}>
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {car.description && (
            <div>
              <h3 className="text-2xl font-display font-bold text-brand-primary mb-3">Description</h3>
              <p className="text-slate-600 leading-relaxed text-base">{car.description}</p>
            </div>
          )}

          {features.length > 0 && (
            <div>
              <h3 className="text-2xl font-display font-bold text-brand-primary mb-4">What's Included</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {features.map(f => {
                  const Icon = FEATURE_ICONS[f] ?? ShieldCheck;
                  return (
                    <div key={f} className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                      <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold text-slate-700">{f}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Extra Services — shown on detail page for information */}
          {extraServices.length > 0 && (
            <div>
              <h3 className="text-2xl font-display font-bold text-brand-primary mb-4">Available Add-ons</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {extraServices.map(svc => (
                  <div key={svc.name}
                    className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500">
                        <Star className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold text-slate-700">{svc.name}</span>
                    </div>
                    <span className="text-sm font-bold text-brand-primary">{formatMoney(svc.priceCents)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {car.excludes && car.excludes.length > 0 && (
            <div>
              <h3 className="text-xl font-display font-bold text-brand-primary mb-3">Not Included</h3>
              <ul className="space-y-1.5">
                {car.excludes.map(e => (
                  <li key={e} className="flex items-center gap-2 text-sm text-slate-500">
                    <span className="text-red-400">✕</span> {e}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right: Booking Panel */}
        <div>
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden sticky top-28">
            <div className="bg-brand-primary p-6 text-white">
              <h3 className="text-xl font-display font-bold mb-1">Rental Summary</h3>
              {dailyRate
                ? <p className="text-brand-primary font-bold text-lg">${(dailyRate.amountCents / 100).toLocaleString('en-US')} / day</p>
                : <p className="text-slate-400 text-sm">Price on application</p>
              }
            </div>

            <div className="p-6 space-y-5">
              {/* Adults */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> Number of Adults
                </label>
                <div className="flex items-center gap-4">
                  <button onClick={() => setAdults(a => Math.max(1, a - 1))}
                    className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50">
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-2xl font-display font-bold text-slate-800 w-8 text-center">{adults}</span>
                  <button onClick={() => setAdults(a => a + 1)}
                    className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Rental Days */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Rental Days</label>
                <div className="flex items-center gap-4">
                  <button onClick={() => setRentalDays(d => Math.max(1, d - 1))}
                    className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50">
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-2xl font-display font-bold text-slate-800 w-8 text-center">{rentalDays}</span>
                  <button onClick={() => setRentalDays(d => d + 1)}
                    className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Pickup Location */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Pickup Location</label>
                <PlacesAutocomplete
                  value={pickupLocation}
                  onChange={setPickupLocation}
                  placeholder="e.g. SSR Airport, Grand Baie"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-primary/20 outline-none"
                />
              </div>

              {/* Pickup Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Pickup Date *</label>
                  <input
                    type="date"
                    value={pickupDate}
                    onChange={e => setPickupDate(e.target.value)}
                    min={today}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-primary/20 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Pickup Time
                  </label>
                  <input
                    type="time"
                    value={pickupTime}
                    onChange={e => setPickupTime(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-primary/20 outline-none"
                  />
                </div>
              </div>

              {/* Dropoff Location */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Drop-off Location</label>
                <PlacesAutocomplete
                  value={dropoffLocation}
                  onChange={setDropoffLocation}
                  placeholder="e.g. Grand Baie Hotel"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-primary/20 outline-none"
                />
              </div>

              {/* Dropoff Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Drop-off Date</label>
                  <input
                    type="date"
                    value={dropoffDate}
                    onChange={e => setDropoffDate(e.target.value)}
                    min={pickupDate || today}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-primary/20 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Drop-off Time
                  </label>
                  <input
                    type="time"
                    value={dropoffTime}
                    onChange={e => setDropoffTime(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-primary/20 outline-none"
                  />
                </div>
              </div>

              {/* ── Extra Services ── */}
              {extraServices.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
                    Add-on Services
                  </label>
                  <div className="space-y-2">
                    {extraServices.map(svc => {
                      const isSelected = selectedExtras.has(svc.name);
                      return (
                        <label
                          key={svc.name}
                          className={cn(
                            'flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all select-none',
                            isSelected
                              ? 'bg-brand-primary/5 border-brand-primary/40 text-brand-primary'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                          )}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={cn(
                              'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all',
                              isSelected ? 'bg-brand-primary border-brand-primary' : 'border-slate-300 bg-white'
                            )}>
                              {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                            </div>
                            <span className="text-sm font-medium">{svc.name}</span>
                          </div>
                          <span className={cn('text-xs font-bold', isSelected ? 'text-brand-primary' : 'text-slate-400')}>
                            +{formatMoney(svc.priceCents)}
                          </span>
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={isSelected}
                            onChange={() => toggleExtra(svc.name)}
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Agent Markup */}
              {isAgent && (
                <div>
                  <label className="text-xs font-bold text-amber-600 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" /> Your Markup (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    placeholder="0"
                    value={markup}
                    onChange={e => setMarkup(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-amber-200 bg-amber-50 text-sm focus:ring-2 focus:ring-amber-300/40 outline-none"
                  />
                  <p className="text-[10px] text-amber-600 mt-1">Markup is collected by you directly from your customer — not charged by Ambiance.</p>
                </div>
              )}

              {/* Price Breakdown */}
              {dailyRate && (
                <div className="border-t border-slate-100 pt-4 space-y-2 text-sm">
                  {/* Base rental */}
                  <div className="flex justify-between text-slate-500">
                    <span>${(perDay / 100).toLocaleString('en-US')} × {rentalDays} day{rentalDays > 1 ? 's' : ''}</span>
                    <span>{formatMoney(baseSubtotal)}</span>
                  </div>
                  {/* Selected extras */}
                  {extraServices
                    .filter(s => selectedExtras.has(s.name))
                    .map(s => (
                      <div key={s.name} className="flex justify-between text-slate-500">
                        <span>{s.name}</span>
                        <span>+{formatMoney(s.priceCents)}</span>
                      </div>
                    ))
                  }
                  <div className="flex justify-between text-slate-500">
                    <span>VAT (15%)</span>
                    <span>{formatMoney(vat)}</span>
                  </div>
                  {isAgent && markupAmt > 0 && (
                    <div className="flex justify-between text-amber-600 font-medium">
                      <span>Your Markup ({markupPct}%)</span>
                      <span>+{formatMoney(markupAmt)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-display font-bold text-slate-900 pt-2 border-t border-slate-100 text-base">
                    <span>{isAgent && markupAmt > 0 ? 'Ambiance charges you' : 'Total'}</span>
                    <span className="text-brand-primary">{formatMoney(total)}</span>
                  </div>
                  {isAgent && markupAmt > 0 && (
                    <div className="flex justify-between font-display font-bold text-amber-700 text-base bg-amber-50 rounded-xl px-3 py-2 -mx-1">
                      <span>You charge customer</span>
                      <span>{formatMoney(customerPrice)}</span>
                    </div>
                  )}
                </div>
              )}

              {!dailyRate ? (
                <a href="mailto:info@ambianceholidays.mu"
                  className="w-full bg-brand-primary text-white py-4 rounded-2xl font-bold text-center block hover:bg-brand-secondary transition-all">
                  Request a Quote
                </a>
              ) : added ? (
                <button
                  onClick={() => navigate('/cart')}
                  className="w-full bg-green-500 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2">
                  <Check className="w-5 h-5" /> View Cart
                </button>
              ) : (
                <button
                  onClick={handleAddToCart}
                  disabled={adding}
                  className="w-full bg-brand-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-brand-primary/20 hover:bg-brand-secondary transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                  {!user ? (
                    <><LogIn className="w-5 h-5" /> Login to Book</>
                  ) : adding ? (
                    'Adding to Cart…'
                  ) : (
                    <><ShoppingCart className="w-5 h-5" /> Add to Cart</>
                  )}
                </button>
              )}

              <p className="text-[10px] text-center text-slate-400 uppercase font-bold tracking-widest">
                Free cancellation up to 24 hours before pickup
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
