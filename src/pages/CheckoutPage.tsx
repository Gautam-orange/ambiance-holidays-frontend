import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, ArrowLeft, User, Phone, Mail, MapPin, Globe, FileText } from 'lucide-react';
import { getCart, initiatePeachCheckout, formatMoney, type CartSummary } from '../api/bookings';
import { useAuth } from '../contexts/AuthContext';

const SUPPORTED_CURRENCIES = ['USD', 'MUR', 'INR'] as const;
type Currency = typeof SUPPORTED_CURRENCIES[number];

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [currency, setCurrency] = useState<Currency>('USD');
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAgent = user?.role === 'B2B_AGENT';

  const [form, setForm] = useState({
    customerFirstName: '',
    customerLastName: '',
    customerEmail: '',
    customerPhone: '',
    whatsappNumber: '',
    address: '',
    nationality: '',
    serviceDate: '',
    specialRequests: '',
  });

  // Pre-populate from logged-in user
  useEffect(() => {
    if (user) {
      setForm(f => ({
        ...f,
        customerFirstName: f.customerFirstName || user.firstName || '',
        customerLastName: f.customerLastName || user.lastName || '',
        customerEmail: f.customerEmail || user.email || '',
      }));
    }
  }, [user]);

  useEffect(() => {
    getCart()
      .then(c => { setCart(c); if (!c || c.items.length === 0) navigate('/cart'); })
      .catch(() => navigate('/cart'))
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) { setError('Please accept the Terms & Conditions to proceed.'); return; }
    setError('');
    setSubmitting(true);
    try {
      // Backend creates a PENDING booking + Peach V2 checkout. Response gives
      // us a redirectUrl pointing at Peach's hosted checkout page — send the
      // browser there. After payment Peach redirects back to /payment/return.
      const init = await initiatePeachCheckout({
        customerFirstName: form.customerFirstName,
        customerLastName: form.customerLastName,
        customerEmail: form.customerEmail,
        customerPhone: form.customerPhone || form.whatsappNumber,
        serviceDate: form.serviceDate,
        specialRequests: form.specialRequests || undefined,
      }, currency);
      window.location.href = init.redirectUrl;
    } catch (err: any) {
      setError(
        err?.response?.data?.error?.message ??
        err?.response?.data?.message ??
        'Could not start payment. Please try again.',
      );
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading…</div>;

  const inputCls = 'w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-primary/20 outline-none';

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <button onClick={() => navigate('/cart')}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-8 font-medium">
        <ArrowLeft className="w-4 h-4" /> Back to Cart
      </button>

      <h1 className="text-3xl font-display font-bold text-slate-800 mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 border border-red-200 rounded-xl p-4 text-sm">{error}</div>
          )}

          {/* Agent info block — pre-filled, read-only */}
          {isAgent && user && (
            <div className="bg-brand-primary/5 border border-brand-primary/20 rounded-2xl p-5">
              <h2 className="font-display font-bold text-slate-800 mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-brand-primary" /> Agent Information
              </h2>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Agent Name</p>
                  <p className="font-medium text-slate-800">{user.firstName} {user.lastName}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email</p>
                  <p className="font-medium text-slate-800">{user.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Customer Details */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="font-display font-bold text-slate-800 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" /> Customer Details
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">First Name *</label>
                <input name="customerFirstName" value={form.customerFirstName} onChange={handleChange} required className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Last Name *</label>
                <input name="customerLastName" value={form.customerLastName} onChange={handleChange} required className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> Email *</span>
                </label>
                <input name="customerEmail" type="email" value={form.customerEmail} onChange={handleChange} required className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</span>
                </label>
                <input name="customerPhone" value={form.customerPhone} onChange={handleChange} className={inputCls} placeholder="+1 555 0000" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-green-500" /> WhatsApp Number *</span>
                </label>
                <input name="whatsappNumber" value={form.whatsappNumber} onChange={handleChange} required className={inputCls} placeholder="+1 555 0000" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> Nationality *</span>
                </label>
                <input name="nationality" value={form.nationality} onChange={handleChange} required className={inputCls} placeholder="e.g. French" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Address *</span>
                </label>
                <input name="address" value={form.address} onChange={handleChange} required className={inputCls} placeholder="Street, City, Country" />
              </div>
            </div>
          </div>

          {/* Service Details */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="font-display font-bold text-slate-800 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" /> Service Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Service Date *</label>
                <input name="serviceDate" type="date" value={form.serviceDate} onChange={handleChange} required
                  min={new Date().toISOString().split('T')[0]}
                  className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Special Requests</label>
                <textarea name="specialRequests" value={form.specialRequests} onChange={handleChange} rows={3}
                  placeholder="Dietary requirements, allergies, special assistance…"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-primary/20 outline-none resize-none" />
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-brand-primary" />
              <span className="text-sm text-slate-600">
                I agree to the{' '}
                <a href="/terms" target="_blank" className="text-brand-primary font-semibold hover:underline">Terms & Conditions</a>
                {' '}and{' '}
                <a href="/privacy" target="_blank" className="text-brand-primary font-semibold hover:underline">Privacy Policy</a>
                . I confirm that the information provided is accurate. *
              </span>
            </label>
          </div>

          <button type="submit" disabled={submitting || !agreedToTerms}
            className="w-full bg-brand-primary text-white py-4 rounded-xl font-bold text-lg hover:bg-brand-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-3">
            <CreditCard className="w-5 h-5" />
            {submitting ? 'Placing Order…' : 'Place Booking'}
          </button>
        </form>

        {cart && (
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sticky top-6">
              <h2 className="font-display font-bold text-slate-800 mb-4">Order Summary</h2>
              <div className="space-y-3 mb-4">
                {cart.items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-slate-600">{item.itemType.replace(/_/g, ' ')} ×{item.quantity}</span>
                    <span className="font-medium text-slate-800">{formatMoney(item.lineTotalCents)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-100 pt-3 space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span><span>{formatMoney(cart.subtotalCents)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>VAT (15%)</span><span>{formatMoney(cart.vatCents)}</span>
                </div>
                <div className="flex justify-between font-display font-bold text-slate-800 pt-2 border-t border-slate-100">
                  <span>Total</span>
                  <span className="text-brand-primary">{formatMoney(cart.totalCents)}</span>
                </div>
              </div>

              <div className="border-t border-slate-100 mt-4 pt-4">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Pay in
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {SUPPORTED_CURRENCIES.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCurrency(c)}
                      className={
                        'py-2 rounded-lg text-sm font-semibold border transition-colors ' +
                        (currency === c
                          ? 'bg-brand-primary text-white border-brand-primary'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50')
                      }
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  The card will be charged in {currency} via Peach Payments. The amount above is the local total before currency conversion.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
