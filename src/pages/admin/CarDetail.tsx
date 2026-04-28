import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import carsApi, { Car, CarCategory, CarRateRequest, RatePeriod } from '../../api/cars';

const CATEGORIES: CarCategory[] = ['ECONOMY', 'STANDARD', 'PREMIUM', 'LUXURY', 'SUV', 'MINIVAN'];

interface ExtraService {
  name: string;
  price: string; // in dollars
}

function AvailabilityStrip({ carId }: { carId: string }) {
  const [blocks, setBlocks] = useState<{ dateFrom: string; dateTo: string }[]>([]);

  useEffect(() => {
    fetch(`/api/v1/admin/cars/${carId}/availability`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
    })
      .then(r => r.json())
      .then(d => setBlocks(d.data ?? []))
      .catch(() => {});
  }, [carId]);

  const today = new Date();
  const days = Array.from({ length: 21 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });
  const isBlocked = (d: Date) => {
    const ds = d.toISOString().split('T')[0];
    return blocks.some(b => b.dateFrom <= ds && b.dateTo >= ds);
  };

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-700 mb-3">3-Week Availability</h2>
      <div className="flex gap-1 overflow-x-auto pb-2">
        {days.map((d, i) => {
          const blocked = isBlocked(d);
          return (
            <div key={i} className={`flex flex-col items-center p-2 rounded-lg min-w-[48px] ${blocked ? 'bg-red-100' : 'bg-green-100'}`}>
              <span className="text-xs font-medium text-gray-500">{d.toLocaleDateString('en', { weekday: 'narrow' })}</span>
              <span className="text-sm font-bold text-gray-800">{d.getDate()}</span>
              <div className={`w-2 h-2 rounded-full mt-1 ${blocked ? 'bg-red-400' : 'bg-green-400'}`} />
            </div>
          );
        })}
      </div>
      <div className="flex gap-4 mt-2 text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-400 inline-block" /> Available</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-400 inline-block" /> Not Available</span>
      </div>
    </div>
  );
}

export default function CarDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [car, setCar]         = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState('');

  // Local editable rate values (in dollars)
  const [dailyRate,   setDailyRate]   = useState('');
  const [weeklyRate,  setWeeklyRate]  = useState('');
  const [monthlyRate, setMonthlyRate] = useState('');

  // Per-KM transfer rates
  const [perKmRates, setPerKmRates] = useState<{ kmFrom: string; kmTo: string; amount: string }[]>([]);

  // Extra services
  const [extraServices, setExtraServices] = useState<ExtraService[]>([]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    carsApi.get(id)
      .then(r => {
        const c = r.data.data;
        setCar(c);
        const daily   = c.rates.find(r => r.period === 'DAILY');
        const weekly  = c.rates.find(r => r.period === 'WEEKLY');
        const monthly = c.rates.find(r => r.period === 'MONTHLY');
        setDailyRate(daily   ? String(daily.amountCents / 100)   : '');
        setWeeklyRate(weekly  ? String(weekly.amountCents / 100)  : '');
        setMonthlyRate(monthly ? String(monthly.amountCents / 100) : '');
        // Load PER_KM rates (transfer pricing tiers)
        const kmRates = c.rates.filter(r => r.period === 'PER_KM');
        setPerKmRates(kmRates.length > 0
          ? kmRates.map(r => ({
              kmFrom: r.kmFrom != null ? String(r.kmFrom) : '',
              kmTo:   r.kmTo   != null ? String(r.kmTo)   : '',
              amount: String(r.amountCents / 100),
            }))
          : []);
        // Parse extra services from includes field (encoded as "XSVC:Name:PriceCents")
        const svcs = (c.includes ?? [])
          .filter(s => s.startsWith('XSVC:'))
          .map(s => {
            const [, name, price] = s.split(':');
            return { name: name ?? '', price: price ? String(Number(price) / 100) : '' };
          });
        setExtraServices(svcs.length > 0 ? svcs : []);
      })
      .catch(() => setError('Could not load car details.'))
      .finally(() => setLoading(false));
  }, [id]);

  const addExtraService    = () => setExtraServices(s => [...s, { name: '', price: '' }]);
  const removeExtraService = (i: number) => setExtraServices(s => s.filter((_, idx) => idx !== i));
  const updateExtraService = (i: number, field: 'name' | 'price', val: string) =>
    setExtraServices(s => s.map((sv, idx) => idx === i ? { ...sv, [field]: val } : sv));

  const addPerKmRate    = () => setPerKmRates(r => [...r, { kmFrom: '', kmTo: '', amount: '' }]);
  const removePerKmRate = (i: number) => setPerKmRates(r => r.filter((_, idx) => idx !== i));
  const updatePerKmRate = (i: number, field: 'kmFrom' | 'kmTo' | 'amount', val: string) =>
    setPerKmRates(r => r.map((row, idx) => idx === i ? { ...row, [field]: val } : row));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!car || !id) return;
    setSaving(true);
    setError('');
    try {
      const rates: CarRateRequest[] = [];
      if (dailyRate)   rates.push({ period: 'DAILY'   as RatePeriod, amountCents: Math.round(parseFloat(dailyRate) * 100) });
      if (weeklyRate)  rates.push({ period: 'WEEKLY'  as RatePeriod, amountCents: Math.round(parseFloat(weeklyRate) * 100) });
      if (monthlyRate) rates.push({ period: 'MONTHLY' as RatePeriod, amountCents: Math.round(parseFloat(monthlyRate) * 100) });
      // Preserve / save PER_KM transfer rates
      perKmRates.forEach(r => {
        const amt = parseFloat(r.amount);
        if (!isNaN(amt) && amt > 0) {
          rates.push({
            period: 'PER_KM' as RatePeriod,
            amountCents: Math.round(amt * 100),
            kmFrom: r.kmFrom !== '' ? Number(r.kmFrom) : undefined,
            kmTo:   r.kmTo   !== '' ? Number(r.kmTo)   : undefined,
          });
        }
      });

      // Encode extra services into includes array as "XSVC:Name:PriceCents"
      const xsvcEntries = extraServices
        .filter(s => s.name.trim())
        .map(s => `XSVC:${s.name.trim()}:${Math.round((parseFloat(s.price) || 0) * 100)}`);

      const regularIncludes = (car.includes ?? []).filter(s => !s.startsWith('XSVC:'));

      await carsApi.update(id, {
        registrationNo:    car.registrationNo,
        name:              car.name,
        category:          car.category,
        usageType:         car.usageType,
        year:              car.year,
        passengerCapacity: car.passengerCapacity,
        luggageCapacity:   car.luggageCapacity ?? undefined,
        hasAc:             car.hasAc,
        automatic:         car.automatic,
        fuelType:          car.fuelType,
        color:             car.color ?? undefined,
        description:       car.description ?? undefined,
        coverImageUrl:     car.coverImageUrl ?? undefined,
        galleryUrls:       car.galleryUrls ?? [],
        includes:          [...regularIncludes, ...xsvcEntries],
        excludes:          car.excludes ?? [],
        rates,
      });
      setSuccess(true);
      setTimeout(() => navigate('/admin/cars'), 1500);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? 'Update failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!car) return <div className="text-center py-20 text-gray-500">Car not found.</div>;

  if (success) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto border border-green-100">
          <CheckCircle2 className="w-10 h-10 text-green-500" />
        </div>
        <h3 className="text-xl font-display font-bold text-slate-900">Car updated successfully!</h3>
        <p className="text-slate-500 text-sm">Redirecting to car management…</p>
      </div>
    </div>
  );

  const showRental   = car.usageType === 'RENTAL'   || car.usageType === 'BOTH';
  const showTransfer = car.usageType === 'TRANSFER' || car.usageType === 'BOTH';

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/admin/cars')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Car — {car.registrationNo}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{car.name}</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 font-medium mb-4">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Availability strip */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm">
        <AvailabilityStrip carId={id!} />
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* ── Core Details ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-5">
          <h2 className="font-bold text-gray-800 text-base">Car Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Registration No</label>
              <input type="text" value={car.registrationNo}
                onChange={e => setCar(c => c && ({ ...c, registrationNo: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Car Name</label>
              <input type="text" value={car.name}
                onChange={e => setCar(c => c && ({ ...c, name: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Category</label>
              <select value={car.category}
                onChange={e => setCar(c => c && ({ ...c, category: e.target.value as CarCategory }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Year</label>
              <input type="number" min={1990} max={2030} value={car.year}
                onChange={e => setCar(c => c && ({ ...c, year: Number(e.target.value) }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Usage Type</label>
              <select value={car.usageType}
                onChange={e => setCar(c => c && ({ ...c, usageType: e.target.value as any }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary">
                <option value="RENTAL">Rental</option>
                <option value="TRANSFER">Transfer</option>
                <option value="BOTH">Both</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Passenger Capacity</label>
              <input type="number" min={1} value={car.passengerCapacity}
                onChange={e => setCar(c => c && ({ ...c, passengerCapacity: Number(e.target.value) }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Luggage Capacity</label>
              <input type="number" min={0} value={car.luggageCapacity ?? ''}
                onChange={e => setCar(c => c && ({ ...c, luggageCapacity: Number(e.target.value) }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Fuel Type</label>
              <select value={car.fuelType ?? 'Petrol'}
                onChange={e => setCar(c => c && ({ ...c, fuelType: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary">
                {['Petrol', 'Diesel', 'Electric', 'Hybrid'].map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Transmission</label>
              <select value={car.automatic ? 'AUTOMATIC' : 'MANUAL'}
                onChange={e => setCar(c => c && ({ ...c, automatic: e.target.value === 'AUTOMATIC' }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary">
                <option value="AUTOMATIC">Automatic</option>
                <option value="MANUAL">Manual</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Color</label>
              <input type="text" value={car.color ?? ''}
                onChange={e => setCar(c => c && ({ ...c, color: e.target.value }))}
                placeholder="Black"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
            </div>
          </div>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div
                onClick={() => setCar(c => c && ({ ...c, hasAc: !c.hasAc }))}
                className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer ${car.hasAc ? 'bg-brand-primary' : 'bg-slate-200'}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${car.hasAc ? 'right-0.5' : 'left-0.5'}`} />
              </div>
              <span className="text-sm font-medium text-slate-700">Air Conditioning</span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Cover Image URL</label>
            <input type="url" value={car.coverImageUrl ?? ''}
              onChange={e => setCar(c => c && ({ ...c, coverImageUrl: e.target.value }))}
              placeholder="https://..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Description</label>
            <textarea rows={3} value={car.description ?? ''}
              onChange={e => setCar(c => c && ({ ...c, description: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none" />
          </div>
        </div>

        {/* ── Rates ── */}
        {showRental && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
            <h2 className="font-bold text-gray-800 text-base">Rental Rates (USD)</h2>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Daily Rate', value: dailyRate, set: setDailyRate },
                { label: 'Weekly Rate', value: weeklyRate, set: setWeeklyRate },
                { label: 'Monthly Rate', value: monthlyRate, set: setMonthlyRate },
              ].map(({ label, value, set }) => (
                <div key={label}>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                    <input type="number" min={0} step={0.01} value={value}
                      onChange={e => set(e.target.value)} placeholder="0.00"
                      className="w-full pl-7 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Transfer / Per-KM Rates ── */}
        {showTransfer && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-gray-800 text-base">Transfer Rates (Per KM)</h2>
                <p className="text-xs text-slate-400 mt-0.5">Tiered pricing based on distance. Leave empty to use system transfer pricing.</p>
              </div>
              <button type="button" onClick={addPerKmRate}
                className="flex items-center gap-1.5 text-brand-primary text-xs font-bold hover:underline">
                <Plus className="w-3.5 h-3.5" /> Add Tier
              </button>
            </div>

            {perKmRates.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No per-km tiers. Click "Add Tier" to add distance-based pricing.</p>
            ) : (
              <>
                <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                  <span>From (km)</span><span>To (km)</span><span>Rate (USD)</span><span />
                </div>
                <div className="space-y-2">
                  {perKmRates.map((row, i) => (
                    <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
                      <input type="number" min={0} placeholder="0" value={row.kmFrom}
                        onChange={e => updatePerKmRate(i, 'kmFrom', e.target.value)}
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                      <input type="number" min={0} placeholder="∞" value={row.kmTo}
                        onChange={e => updatePerKmRate(i, 'kmTo', e.target.value)}
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                        <input type="number" min={0} step={0.01} placeholder="0.00" value={row.amount}
                          onChange={e => updatePerKmRate(i, 'amount', e.target.value)}
                          className="w-full pl-7 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                      </div>
                      <button type="button" onClick={() => removePerKmRate(i)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Extra Services ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-800 text-base">Extra Services</h2>
            <button type="button" onClick={addExtraService}
              className="flex items-center gap-1.5 text-brand-primary text-xs font-bold hover:underline">
              <Plus className="w-3.5 h-3.5" /> Add Service
            </button>
          </div>

          {extraServices.length === 0 ? (
            <p className="text-sm text-slate-400 italic">No extra services added. Click "Add Service" to add one.</p>
          ) : (
            <div className="space-y-3">
              {extraServices.map((svc, i) => (
                <div key={i} className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Service name (e.g. Child Seat)"
                    value={svc.name}
                    onChange={e => updateExtraService(i, 'name', e.target.value)}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                  <div className="relative w-32">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      placeholder="0.00"
                      value={svc.price}
                      onChange={e => updateExtraService(i, 'price', e.target.value)}
                      className="w-full pl-7 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
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

        {/* ── Actions ── */}
        <div className="flex gap-3">
          <button type="button" onClick={() => navigate('/admin/cars')}
            className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 bg-brand-primary text-white py-3 rounded-xl font-bold hover:bg-brand-secondary disabled:opacity-50 transition-colors shadow-lg shadow-brand-primary/20">
            <Save className="w-4 h-4" />
            {saving ? 'Updating…' : 'Update Car'}
          </button>
        </div>
      </form>
    </div>
  );
}
