import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Users, Briefcase, Zap, CheckCircle, XCircle, ShoppingCart, Check, TrendingUp, LogIn } from 'lucide-react';
import { addToCart } from '../api/bookings';
import { useAuth } from '../contexts/AuthContext';

type TransferRoute = {
  id: string;
  fromLocation: string;
  toLocation: string;
  tripType: string;
  carCategory: string;
  basePriceCents: number;
  estDurationMins: number;
  estKm: number;
  isActive: boolean;
  includes: string[];
  excludes: string[];
  description: string;
};

export default function TransferDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isAgent = user?.role === 'B2B_AGENT';
  const [route, setRoute] = useState<TransferRoute | null>(null);
  const [loading, setLoading] = useState(true);
  const [markup, setMarkup] = useState('');
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    fetch(`/api/v1/catalog/transfers/${id}`)
      .then(r => r.json())
      .then(d => setRoute(d.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!route) return <div className="text-center py-20 text-gray-500">Transfer route not found.</div>;

  const fmt = (c: number) => `$${(c / 100).toLocaleString('en-US')}`;
  const markupPct = parseFloat(markup) || 0;
  const markupAmt = Math.round(route.basePriceCents * markupPct / 100);
  const customerPrice = route.basePriceCents + markupAmt;

  const handleBook = async () => {
    if (!user) { navigate('/auth/login', { state: { from: location } }); return; }
    setAdding(true);
    try {
      await addToCart({
        itemType: 'CAR_TRANSFER',
        refId: route.id,
        quantity: 1,
        options: {
          unitPriceCents: route.basePriceCents,
          pickupLocation: route.fromLocation,
          dropoffLocation: route.toLocation,
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
    <div className="max-w-5xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Transfers
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium mb-3">{route.tripType.replace('_', ' ')}</span>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">{route.fromLocation} → {route.toLocation}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>{route.carCategory}</span>
              {route.estDurationMins && <span>~{route.estDurationMins} min</span>}
              {route.estKm && <span>~{route.estKm} km</span>}
            </div>
          </div>

          {route.description && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">About This Transfer</h2>
              <p className="text-gray-600 text-sm leading-relaxed">{route.description}</p>
            </div>
          )}

          {/* Inclusions / Exclusions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {route.includes?.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-900 mb-2">Inclusions</h2>
                <ul className="space-y-1">
                  {route.includes.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />{item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {route.excludes?.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-900 mb-2">Exclusions</h2>
                <ul className="space-y-1">
                  {route.excludes.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                      <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />{item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="bg-red-50 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-red-800 mb-3">Cancellation Policy</h2>
            <ul className="space-y-1 text-xs text-red-700">
              <li>Free cancellation if cancelled more than 24 hours before pickup</li>
              <li>50% fee if cancelled 12–24 hours before</li>
              <li>75% fee if cancelled 3–12 hours before</li>
              <li>No refund if cancelled less than 2 hours before</li>
            </ul>
          </div>
        </div>

        {/* Booking sidebar */}
        <div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm sticky top-4 space-y-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">Transfer rate</p>
              <p className="text-2xl font-bold text-gray-900">{fmt(route.basePriceCents)}</p>
            </div>

            {/* Agent Markup */}
            {isAgent && (
              <div>
                <label className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
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
                  className="w-full border border-amber-200 bg-amber-50 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-300/40"
                />
                <p className="text-[10px] text-amber-600 mt-1">Collected by you from your customer. Not charged by Ambiance.</p>
              </div>
            )}

            {/* Price breakdown */}
            <div className="border-t border-gray-100 pt-3 space-y-2 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>{isAgent && markupAmt > 0 ? 'Ambiance charges you' : 'Total'}</span>
                <span className="font-semibold text-gray-900">{fmt(route.basePriceCents)}</span>
              </div>
              {isAgent && markupAmt > 0 && (
                <>
                  <div className="flex justify-between text-amber-600">
                    <span>Your markup ({markupPct}%)</span>
                    <span>+{fmt(markupAmt)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-amber-700 bg-amber-50 rounded-xl px-3 py-2 -mx-1">
                    <span>You charge customer</span>
                    <span>{fmt(customerPrice)}</span>
                  </div>
                </>
              )}
            </div>

            {added ? (
              <button onClick={() => navigate('/cart')}
                className="w-full bg-green-500 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2">
                <Check className="w-4 h-4" /> View Cart
              </button>
            ) : (
              <button
                onClick={handleBook}
                disabled={adding}
                className="w-full bg-brand-primary text-white py-3 rounded-xl font-semibold hover:bg-brand-secondary transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {!user ? (
                  <><LogIn className="w-4 h-4" /> Login to Book</>
                ) : adding ? (
                  'Adding…'
                ) : (
                  <><ShoppingCart className="w-4 h-4" /> Book This Transfer</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
