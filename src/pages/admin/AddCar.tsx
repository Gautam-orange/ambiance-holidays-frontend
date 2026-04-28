import React, { useState } from 'react';
import { Upload, Plus, ChevronDown, AlertCircle, CheckCircle2, X, Trash2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import carsApi, { CarCategory, CarUsageType, CarRateRequest, RatePeriod } from '../../api/cars';
import LoadingSpinner from '../../components/LoadingSpinner';

const CATEGORIES: CarCategory[] = ['ECONOMY', 'STANDARD', 'PREMIUM', 'LUXURY', 'SUV', 'MINIVAN'];

interface RateRow {
  period: RatePeriod;
  amountEur: string;
  kmFrom: string;
  kmTo: string;
}

const DEFAULT_RENTAL_RATES: RateRow[] = [
  { period: 'DAILY', amountEur: '', kmFrom: '', kmTo: '' },
  { period: 'WEEKLY', amountEur: '', kmFrom: '', kmTo: '' },
  { period: 'MONTHLY', amountEur: '', kmFrom: '', kmTo: '' },
];
const DEFAULT_TRANSFER_RATES: RateRow[] = [
  { period: 'PER_KM', amountEur: '', kmFrom: '0', kmTo: '20' },
  { period: 'PER_KM', amountEur: '', kmFrom: '21', kmTo: '150' },
  { period: 'PER_KM', amountEur: '', kmFrom: '151', kmTo: '' },
];

export default function AddCar() {
  const navigate = useNavigate();
  const [usageType, setUsageType] = useState<'RENTAL' | 'TRANSFER' | 'BOTH'>('RENTAL');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    registrationNo: '',
    name: '',
    category: 'ECONOMY' as CarCategory,
    year: new Date().getFullYear(),
    passengerCapacity: 4,
    luggageCapacity: '',
    hasAc: true,
    automatic: true,
    fuelType: 'Petrol',
    color: '',
    description: '',
    coverImageUrl: '',
    includes: '',
    excludes: '',
  });

  const [rentalRates, setRentalRates] = useState<RateRow[]>(DEFAULT_RENTAL_RATES.map(r => ({ ...r })));
  const [transferRates, setTransferRates] = useState<RateRow[]>(DEFAULT_TRANSFER_RATES.map(r => ({ ...r })));

  // Extra services
  const [extraServices, setExtraServices] = useState<{ name: string; price: string }[]>([]);
  const addExtraService    = () => setExtraServices(s => [...s, { name: '', price: '' }]);
  const removeExtraService = (i: number) => setExtraServices(s => s.filter((_, idx) => idx !== i));
  const updateExtraService = (i: number, field: 'name' | 'price', val: string) =>
    setExtraServices(s => s.map((sv, idx) => idx === i ? { ...sv, [field]: val } : sv));

  const field = (key: keyof typeof form) => ({
    value: String(form[key]),
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value })),
  });

  const activeRates = usageType === 'TRANSFER' ? transferRates : rentalRates;
  const setActiveRates = usageType === 'TRANSFER' ? setTransferRates : setRentalRates;

  const updateRate = (idx: number, key: keyof RateRow, value: string) => {
    setActiveRates(prev => prev.map((r, i) => i === idx ? { ...r, [key]: value } : r));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const rates: CarRateRequest[] = activeRates
      .filter(r => r.amountEur.trim() !== '')
      .map(r => ({
        period: r.period,
        amountCents: Math.round(parseFloat(r.amountEur) * 100),
        kmFrom: r.kmFrom ? parseInt(r.kmFrom) : undefined,
        kmTo: r.kmTo ? parseInt(r.kmTo) : undefined,
      }));

    setIsLoading(true);
    try {
      // Encode extra services as "XSVC:Name:PriceCents" in the includes array
      const xsvcEntries = extraServices
        .filter(s => s.name.trim())
        .map(s => `XSVC:${s.name.trim()}:${Math.round((parseFloat(s.price) || 0) * 100)}`);

      const regularIncludes = form.includes ? form.includes.split('\n').filter(Boolean) : [];

      await carsApi.create({
        registrationNo: form.registrationNo,
        name: form.name,
        category: form.category,
        usageType: usageType as CarUsageType,
        year: Number(form.year),
        passengerCapacity: Number(form.passengerCapacity),
        luggageCapacity: form.luggageCapacity ? Number(form.luggageCapacity) : undefined,
        hasAc: form.hasAc,
        automatic: form.automatic,
        fuelType: form.fuelType,
        color: form.color || undefined,
        description: form.description || undefined,
        coverImageUrl: form.coverImageUrl || undefined,
        includes: [...regularIncludes, ...xsvcEntries],
        excludes: form.excludes ? form.excludes.split('\n').filter(Boolean) : [],
        rates,
      });
      setSuccess(true);
      setTimeout(() => navigate('/admin/cars'), 1500);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? 'Failed to add car. Please check your inputs.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto border border-green-100">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h3 className="text-xl font-display font-bold text-slate-900">Car added successfully!</h3>
          <p className="text-slate-500 text-sm">Redirecting to car management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold text-slate-800">Add Car</h2>
          <p className="text-slate-500 mt-1">Register a new vehicle to the fleet</p>
        </div>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl">
          {(['RENTAL', 'TRANSFER', 'BOTH'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setUsageType(t)}
              className={cn("px-6 py-2 rounded-xl text-sm font-bold transition-all",
                usageType === t ? "bg-white text-brand-primary shadow-sm" : "text-slate-400")}
            >
              {t === 'RENTAL' ? 'Rental' : t === 'TRANSFER' ? 'Transfer' : 'Both'}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Image */}
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-4">
              {form.coverImageUrl ? (
                <div className="w-full aspect-video rounded-2xl overflow-hidden relative">
                  <img src={form.coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setForm(f => ({ ...f, coverImageUrl: '' }))}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary">
                    <Upload className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-700">Cover Image URL</p>
                    <p className="text-xs text-slate-400 mt-1">Paste an image URL below</p>
                  </div>
                </>
              )}
              <input
                type="url"
                placeholder="https://..."
                value={form.coverImageUrl}
                onChange={e => setForm(f => ({ ...f, coverImageUrl: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            {/* Includes / Excludes */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Includes (one per line)</label>
                <textarea
                  rows={3}
                  placeholder="GPS&#10;Child seat&#10;Insurance"
                  value={form.includes}
                  onChange={e => setForm(f => ({ ...f, includes: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-primary resize-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Excludes (one per line)</label>
                <textarea
                  rows={3}
                  placeholder="Fuel&#10;Driver"
                  value={form.excludes}
                  onChange={e => setForm(f => ({ ...f, excludes: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-primary resize-none"
                />
              </div>
            </div>
          </div>

          {/* Right: Form */}
          <div className="lg:col-span-2 bg-white p-10 rounded-3xl border border-slate-200 shadow-sm space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Registration No *</label>
                <input required type="text" placeholder="MU-1234-ABC" {...field('registrationNo')}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none text-sm font-medium" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Car Name *</label>
                <input required type="text" placeholder="e.g. BMW X7" {...field('name')}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none text-sm font-medium" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Category *</label>
                <div className="relative">
                  <select required value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as CarCategory }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none text-sm font-medium appearance-none">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Year *</label>
                <input required type="number" min={1990} max={2030} {...field('year')}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none text-sm font-medium" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Passengers *</label>
                <input required type="number" min={1} max={30} {...field('passengerCapacity')}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none text-sm font-medium" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Luggage Capacity</label>
                <input type="number" min={0} {...field('luggageCapacity')} placeholder="e.g. 3"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none text-sm font-medium" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Color</label>
                <input type="text" placeholder="Black" {...field('color')}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none text-sm font-medium" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fuel Type</label>
                <div className="relative">
                  <select value={form.fuelType} onChange={e => setForm(f => ({ ...f, fuelType: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none text-sm font-medium appearance-none">
                    {['Petrol', 'Diesel', 'Electric', 'Hybrid'].map(f => <option key={f}>{f}</option>)}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description</label>
              <textarea rows={3} placeholder="Vehicle details and highlights..." value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none text-sm font-medium resize-none" />
            </div>

            {/* Pricing Rates */}
            <div className="space-y-4">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Pricing Rates ($) — {usageType === 'TRANSFER' ? 'Per-KM bands' : 'Time-based'}
              </label>
              <div className="space-y-3">
                {activeRates.map((rate, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-28 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {rate.period === 'PER_KM'
                        ? `${rate.kmFrom}–${rate.kmTo || '∞'} km`
                        : rate.period}
                    </div>
                    <div className="flex-1 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">Rs</span>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        placeholder="0.00"
                        value={rate.amountEur}
                        onChange={e => updateRate(idx, 'amountEur', e.target.value)}
                        className="w-full pl-7 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none text-sm font-medium"
                      />
                    </div>
                    {rate.period === 'PER_KM' && (
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <input type="number" min={0} placeholder="from"
                          value={rate.kmFrom} onChange={e => updateRate(idx, 'kmFrom', e.target.value)}
                          className="w-16 px-2 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none text-center" />
                        <span>to</span>
                        <input type="number" min={0} placeholder="∞"
                          value={rate.kmTo} onChange={e => updateRate(idx, 'kmTo', e.target.value)}
                          className="w-16 px-2 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none text-center" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-100">
              {[
                { key: 'hasAc' as const, label: 'Air Conditioning' },
                { key: 'automatic' as const, label: 'Automatic' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-600">{label}</span>
                  <button type="button" onClick={() => setForm(f => ({ ...f, [key]: !f[key] }))}
                    className={cn("w-12 h-6 rounded-full relative transition-colors",
                      form[key] ? "bg-brand-primary" : "bg-slate-200")}>
                    <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300",
                      form[key] ? "right-1" : "left-1")} />
                  </button>
                </div>
              ))}
            </div>

            {/* Extra Services */}
            <div className="space-y-4 pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Extra Services</label>
                <button type="button" onClick={addExtraService}
                  className="flex items-center gap-1 text-brand-primary text-xs font-bold hover:underline">
                  <Plus className="w-3.5 h-3.5" /> Add Service
                </button>
              </div>
              {extraServices.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No extra services yet — click "Add Service" above.</p>
              ) : (
                <div className="space-y-2">
                  {extraServices.map((svc, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Service name (e.g. Child Seat)"
                        value={svc.name}
                        onChange={e => updateExtraService(i, 'name', e.target.value)}
                        className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary outline-none"
                      />
                      <div className="relative w-28">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          placeholder="0.00"
                          value={svc.price}
                          onChange={e => updateExtraService(i, 'price', e.target.value)}
                          className="w-full pl-7 pr-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary outline-none"
                        />
                      </div>
                      <button type="button" onClick={() => removeExtraService(i)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-2">
              <Link to="/admin/cars" className="flex-1">
                <button type="button" className="w-full py-4 bg-slate-100 text-brand-primary rounded-2xl font-bold hover:bg-slate-200 transition-all">
                  Cancel
                </button>
              </Link>
              <button type="submit" disabled={isLoading}
                className="flex-1 py-4 bg-brand-primary text-white rounded-2xl font-bold hover:bg-brand-secondary shadow-xl shadow-brand-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                {isLoading ? <LoadingSpinner size="sm" /> : 'Save Car'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
