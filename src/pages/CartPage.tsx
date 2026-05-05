import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart, Trash2, ArrowRight, Package, MapPin, Calendar, Clock, Users,
  Car, Route, Tag, Star,
} from 'lucide-react';
import {
  getCart, removeFromCart, clearCart, formatMoney,
  type CartSummary, type CartItem,
} from '../api/bookings';

// Internal/system option keys — never shown to the user.
const HIDDEN_OPTION_KEYS = new Set([
  'unitPriceCents', 'dailyRateCents', 'priceCents',
  'carId', 'tierId', 'refId',
  'tierLabel', 'markupPct', 'commissionPct',
  'selectedExtras', // rendered separately as a list
]);

// Pretty labels for known itemTypes
const ITEM_TYPE_LABEL: Record<string, string> = {
  CAR_RENTAL: 'Car Rental',
  CAR_TRANSFER: 'Transfer',
  TOUR: 'Tour',
  DAY_TRIP: 'Local Experience',
  HOTEL: 'Hotel',
};

function prettyEnum(s: string): string {
  // MULTI_TRIP → Multi Trip
  return s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

function fmtDate(s: string): string {
  // Accept YYYY-MM-DD or ISO; fall back to original string on parse failure.
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtTime(s: string): string {
  // "HH:MM" → "3:48 PM"
  const m = /^(\d{1,2}):(\d{2})/.exec(s);
  if (!m) return s;
  const h = +m[1], min = +m[2];
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(min).padStart(2, '0')} ${period}`;
}

interface DisplayDetail { icon: React.ElementType; text: string; key: string }

/**
 * Pulls the user-relevant details out of cart item options as a list of
 * { icon, text } rows. Anything not understood falls through as a generic
 * "Key: value" row so we never silently drop info — only the keys explicitly
 * in HIDDEN_OPTION_KEYS are suppressed.
 */
function buildDetails(item: CartItem): DisplayDetail[] {
  const out: DisplayDetail[] = [];
  const o = (item.options ?? {}) as Record<string, unknown>;

  const dateStr  = typeof o.date === 'string' ? o.date : null;
  const timeStr  = typeof o.time === 'string' ? o.time : null;
  if (dateStr && timeStr) {
    out.push({ key: '__datetime', icon: Calendar, text: `${fmtDate(dateStr)} · ${fmtTime(timeStr)}` });
  } else if (dateStr) {
    out.push({ key: 'date', icon: Calendar, text: fmtDate(dateStr) });
  } else if (timeStr) {
    out.push({ key: 'time', icon: Clock, text: fmtTime(timeStr) });
  }

  const pickup  = typeof o.pickupLocation === 'string'  ? o.pickupLocation  : null;
  const dropoff = typeof o.dropoffLocation === 'string' ? o.dropoffLocation : null;
  if (pickup || dropoff) {
    out.push({ key: '__route', icon: MapPin, text: [pickup, dropoff].filter(Boolean).join(' → ') });
  }

  const stops = Array.isArray(o.stops) ? (o.stops as unknown[]).filter(s => typeof s === 'string') : [];
  if (stops.length > 0) {
    out.push({ key: 'stops', icon: Route, text: `Stops: ${stops.join(' · ')}` });
  }

  const adults = typeof o.adults === 'number'    ? o.adults
               : typeof o.paxAdults === 'number' ? o.paxAdults : null;
  const children = typeof o.paxChildren === 'number' ? o.paxChildren : 0;
  const infants  = typeof o.paxInfants === 'number'  ? o.paxInfants  : 0;
  if (adults !== null) {
    const parts = [`${adults} adult${adults === 1 ? '' : 's'}`];
    if (children > 0) parts.push(`${children} child${children === 1 ? '' : 'ren'}`);
    if (infants > 0)  parts.push(`${infants} infant${infants === 1 ? '' : 's'}`);
    out.push({ key: '__pax', icon: Users, text: parts.join(', ') });
  }

  const carName = typeof o.carName === 'string' ? o.carName : null;
  if (carName) out.push({ key: 'carName', icon: Car, text: carName });

  const tripType = typeof o.tripType === 'string' ? o.tripType : null;
  if (tripType) out.push({ key: 'tripType', icon: Tag, text: prettyEnum(tripType) });

  const distance = typeof o.distanceKm === 'number' ? o.distanceKm : null;
  if (distance !== null) out.push({ key: 'distanceKm', icon: Route, text: `${distance} km` });

  const rentalDays = typeof o.rentalDays === 'number' ? o.rentalDays : null;
  if (rentalDays !== null) out.push({ key: 'rentalDays', icon: Calendar, text: `${rentalDays} day${rentalDays === 1 ? '' : 's'} rental` });

  const notes = typeof o.notes === 'string' ? o.notes
              : typeof o.specialRequests === 'string' ? o.specialRequests : null;
  if (notes) out.push({ key: 'notes', icon: Tag, text: notes });

  // Catch-all: any option key we didn't explicitly handle and isn't internal.
  const handledKeys = new Set([
    'date', 'time', 'pickupLocation', 'dropoffLocation', 'stops',
    'adults', 'paxAdults', 'paxChildren', 'paxInfants',
    'carName', 'tripType', 'distanceKm', 'rentalDays',
    'notes', 'specialRequests',
  ]);
  for (const [k, v] of Object.entries(o)) {
    if (HIDDEN_OPTION_KEYS.has(k) || handledKeys.has(k)) continue;
    if (v == null || v === '') continue;
    const val = Array.isArray(v) ? v.join(', ') : String(v);
    out.push({
      key: k,
      icon: Tag,
      text: `${k.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase())}: ${val}`,
    });
  }
  return out;
}

interface SelectedExtra { name: string; priceCents: number }
function getSelectedExtras(item: CartItem): SelectedExtra[] {
  const raw = (item.options as Record<string, unknown> | null)?.selectedExtras;
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((e): e is Record<string, unknown> => !!e && typeof e === 'object')
    .map(e => ({
      name: String(e.name ?? ''),
      priceCents: typeof e.priceCents === 'number' ? e.priceCents
                : typeof e.unitPriceCents === 'number' ? e.unitPriceCents : 0,
    }))
    .filter(e => e.name);
}

export default function CartPage() {
  const [cart, setCart] = useState<CartSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const navigate = useNavigate();

  const load = async () => {
    try {
      const c = await getCart();
      setCart(c);
    } catch {
      setCart({ items: [], subtotalCents: 0, vatCents: 0, totalCents: 0, itemCount: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRemove = async (id: string) => {
    setRemoving(id);
    try {
      const updated = await removeFromCart(id);
      setCart(updated);
    } finally {
      setRemoving(null);
    }
  };

  const handleClear = async () => {
    if (!confirm('Clear your cart?')) return;
    await clearCart();
    setCart({ items: [], subtotalCents: 0, vatCents: 0, totalCents: 0, itemCount: 0 });
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading cart…</div>;

  const isEmpty = !cart || cart.items.length === 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="flex items-center gap-3 mb-8">
        <ShoppingCart className="w-7 h-7 text-brand-primary" />
        <h1 className="text-3xl font-display font-bold text-slate-800">Your Cart</h1>
        {!isEmpty && (
          <span className="ml-2 bg-brand-primary text-white text-xs font-bold px-2.5 py-1 rounded-full">
            {cart!.itemCount}
          </span>
        )}
      </div>

      {isEmpty ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
          <Package className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h2 className="text-xl font-display font-bold text-slate-800 mb-2">Your cart is empty</h2>
          <p className="text-slate-500 mb-6">Browse our tours, car rentals, and transfers to get started.</p>
          <Link to="/tours" className="inline-flex items-center gap-2 bg-brand-primary text-white px-6 py-3 rounded-xl font-bold">
            Browse Tours <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {cart!.items.map(item => {
              const details = buildDetails(item);
              const extras  = getSelectedExtras(item);
              return (
                <div key={item.id} className="group bg-white rounded-2xl border border-slate-200 p-5 hover:border-slate-300 transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Image */}
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title ?? item.itemType}
                        className="w-20 h-20 rounded-xl object-cover flex-shrink-0 bg-slate-100"
                        onError={e => {
                          const img = e.target as HTMLImageElement;
                          img.style.display = 'none';
                          img.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                        <Package className="w-8 h-8 text-brand-primary" />
                      </div>
                    )}

                    {/* Title + meta */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-display font-bold text-slate-800 text-base">
                          {item.title ?? ITEM_TYPE_LABEL[item.itemType] ?? item.itemType}
                        </h3>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary">
                          {ITEM_TYPE_LABEL[item.itemType] ?? item.itemType.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">Qty {item.quantity}</p>
                    </div>

                    {/* Price + actions */}
                    <div className="text-right flex-shrink-0">
                      <p className="font-display font-bold text-slate-800 text-lg">{formatMoney(item.lineTotalCents)}</p>
                      {item.quantity > 1 && (
                        <p className="text-xs text-slate-400">{formatMoney(item.unitPriceCents)} each</p>
                      )}
                      <button
                        onClick={() => handleRemove(item.id)}
                        disabled={removing === item.id}
                        title="Remove from cart"
                        aria-label="Remove from cart"
                        className="mt-2 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Booking detail rows */}
                  {details.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                      {details.map(d => {
                        const Icon = d.icon;
                        return (
                          <div key={d.key} className="flex items-start gap-2 text-slate-600">
                            <Icon className="w-3.5 h-3.5 text-brand-primary mt-0.5 flex-shrink-0" />
                            <span className="leading-snug">{d.text}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Selected add-ons */}
                  {extras.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        <Star className="w-3 h-3 text-amber-400" /> Add-on Services
                      </p>
                      <ul className="space-y-1 text-xs">
                        {extras.map((e, i) => (
                          <li key={i} className="flex justify-between text-slate-600">
                            <span>{e.name}</span>
                            <span className="font-medium text-slate-700">{formatMoney(e.priceCents)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}

            <div className="flex justify-end">
              <button
                onClick={handleClear}
                className="text-sm text-red-400 hover:text-red-600 font-medium"
              >
                Clear cart
              </button>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sticky top-6">
              <h2 className="font-display font-bold text-slate-800 mb-4">Order Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>{formatMoney(cart!.subtotalCents)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>VAT (15%)</span>
                  <span>{formatMoney(cart!.vatCents)}</span>
                </div>
                <div className="border-t border-slate-100 pt-3 flex justify-between font-display font-bold text-slate-800">
                  <span>Total</span>
                  <span className="text-brand-primary">{formatMoney(cart!.totalCents)}</span>
                </div>
              </div>
              <button
                onClick={() => navigate('/checkout')}
                className="w-full mt-6 bg-brand-primary text-white py-3 rounded-xl font-bold hover:bg-brand-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                Proceed to Checkout <ArrowRight className="w-4 h-4" />
              </button>
              <Link
                to="/tours"
                className="w-full mt-3 block text-center text-sm text-slate-400 hover:text-slate-600"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
