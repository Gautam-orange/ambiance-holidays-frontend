import React, { useEffect, useState } from 'react';
import { Plus, ChevronDown, AlertCircle, CheckCircle2, Trash2, X } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import carsApi, { CarCategory, CarUsageType, CarStatus, CarRateRequest, RatePeriod, SupplierOption } from '../../api/cars';
import LoadingSpinner from '../../components/LoadingSpinner';
import CoverImageInput from '../../components/CoverImageInput';

const CATEGORIES: CarCategory[] = ['ECONOMY', 'STANDARD', 'PREMIUM', 'LUXURY', 'SUV', 'MINIVAN'];
const STATUSES: CarStatus[] = ['ACTIVE', 'INACTIVE', 'MAINTENANCE'];

interface RentalRow { period: 'DAILY' | 'WEEKLY' | 'MONTHLY'; amountUsd: string }
interface TransferBand { amountUsd: string; kmFrom: string; kmTo: string }

const DEFAULT_RENTAL_ROWS: RentalRow[] = [
  { period: 'DAILY', amountUsd: '' },
  { period: 'WEEKLY', amountUsd: '' },
  { period: 'MONTHLY', amountUsd: '' },
];
const DEFAULT_TRANSFER_BANDS: TransferBand[] = [
  { amountUsd: '', kmFrom: '0', kmTo: '20' },
  { amountUsd: '', kmFrom: '21', kmTo: '150' },
  { amountUsd: '', kmFrom: '151', kmTo: '' },
];

export default function AddCar() {
  const navigate = useNavigate();
  const [usageType, setUsageType] = useState<CarUsageType>('RENTAL');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);

  const [form, setForm] = useState({
    registrationNo: '',
    name: '',
    category: 'ECONOMY' as CarCategory,
    year: new Date().getFullYear(),
    passengerCapacity: 4,
    luggageCapacity: '',
    hasAc: true,
    automatic: true,
    transmissionGears: '',
    fuelType: 'Petrol',
    color: '',
    description: '',
    coverImageUrl: '',
    supplierId: '',
    status: 'ACTIVE' as CarStatus,
  });

  // Includes/Excludes are now structured row lists (one input per row + Add
  // Item button) so the form matches the Figma reference. Stored as String[]
  // server-side just like before — only the UX changed.
  const [includes, setIncludes] = useState<string[]>(['']);
  const [excludes, setExcludes] = useState<string[]>(['']);

  const [rentalRows, setRentalRows] = useState<RentalRow[]>(DEFAULT_RENTAL_ROWS.map(r => ({ ...r })));
  const [transferBands, setTransferBands] = useState<TransferBand[]>(DEFAULT_TRANSFER_BANDS.map(r => ({ ...r })));
  const [extraServices, setExtraServices] = useState<{ name: string; priceUsd: string }[]>([]);

  // Load supplier dropdown options once
  useEffect(() => {
    carsApi.listSuppliers()
      .then(r => setSuppliers(r.data.data ?? []))
      .catch(() => { /* admins may not have permission yet — just hide picker */ });
  }, []);

  const addExtraService    = () => setExtraServices(s => [...s, { name: '', priceUsd: '' }]);
  const removeExtraService = (i: number) => setExtraServices(s => s.filter((_, idx) => idx !== i));
  const updateExtraService = (i: number, field: 'name' | 'priceUsd', val: string) =>
    setExtraServices(s => s.map((sv, idx) => idx === i ? { ...sv, [field]: val } : sv));

  const showRental   = usageType === 'RENTAL'   || usageType === 'BOTH';
  const showTransfer = usageType === 'TRANSFER' || usageType === 'BOTH';

  const updateRentalRow = (idx: number, amountUsd: string) =>
    setRentalRows(prev => prev.map((r, i) => i === idx ? { ...r, amountUsd } : r));
  const updateTransferBand = (idx: number, key: keyof TransferBand, value: string) =>
    setTransferBands(prev => prev.map((r, i) => i === idx ? { ...r, [key]: value } : r));

  /** Mirror of backend `validateRates` so admins see errors inline. */
  const validateClientSide = (): string | null => {
    const filledRental = rentalRows.filter(r => r.amountUsd.trim() !== '');
    const filledTransfer = transferBands.filter(r => r.amountUsd.trim() !== '');

    if (showRental) {
      const hasDaily = filledRental.some(r => r.period === 'DAILY' && Number(r.amountUsd) > 0);
      if (!hasDaily) return 'Rental cars need at least a DAILY rate.';
      for (const r of filledRental) {
        const amt = parseFloat(r.amountUsd);
        if (Number.isNaN(amt) || amt <= 0) return `${r.period} rate must be greater than zero.`;
      }
    }
    if (showTransfer) {
      if (filledTransfer.length === 0) {
        return 'Transfer-eligible cars need at least one PER_KM rate band.';
      }
      for (let i = 0; i < filledTransfer.length; i++) {
        const r = filledTransfer[i];
        const amt = parseFloat(r.amountUsd);
        if (Number.isNaN(amt) || amt <= 0) return `Transfer band ${i + 1}: price must be greater than zero.`;
        const from = r.kmFrom.trim() ? parseInt(r.kmFrom) : 0;
        const to = r.kmTo.trim() ? parseInt(r.kmTo) : null;
        if (Number.isNaN(from) || from < 0) return `Transfer band ${i + 1}: From-km cannot be negative.`;
        if (to !== null && (Number.isNaN(to) || to <= from)) return `Transfer band ${i + 1}: To-km must be greater than From-km.`;
      }
      // Overlap check
      const sorted = [...filledTransfer].sort((a, b) => (parseInt(a.kmFrom || '0')) - (parseInt(b.kmFrom || '0')));
      for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1];
        const curr = sorted[i];
        const prevTo = prev.kmTo.trim() ? parseInt(prev.kmTo) : Number.MAX_SAFE_INTEGER;
        const currFrom = curr.kmFrom.trim() ? parseInt(curr.kmFrom) : 0;
        if (currFrom <= prevTo) return `Transfer bands overlap at ${prevTo}–${currFrom} km.`;
      }
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validateClientSide();
    if (validationError) { setError(validationError); return; }

    // Build a single rates list that contains BOTH rental periods and transfer
    // bands for BOTH-usage cars — fixes the prior bug where only the active tab
    // was submitted.
    const rates: CarRateRequest[] = [];
    if (showRental) {
      for (const r of rentalRows) {
        if (!r.amountUsd.trim()) continue;
        rates.push({
          period: r.period as RatePeriod,
          amountCents: Math.round(parseFloat(r.amountUsd) * 100),
        });
      }
    }
    if (showTransfer) {
      for (const r of transferBands) {
        if (!r.amountUsd.trim()) continue;
        rates.push({
          period: 'PER_KM',
          amountCents: Math.round(parseFloat(r.amountUsd) * 100),
          kmFrom: r.kmFrom ? parseInt(r.kmFrom) : undefined,
          kmTo: r.kmTo ? parseInt(r.kmTo) : undefined,
        });
      }
    }

    setIsLoading(true);
    try {
      await carsApi.create({
        registrationNo: form.registrationNo,
        name: form.name,
        category: form.category,
        usageType,
        year: Number(form.year),
        passengerCapacity: Number(form.passengerCapacity),
        luggageCapacity: form.luggageCapacity ? Number(form.luggageCapacity) : undefined,
        hasAc: form.hasAc,
        automatic: form.automatic,
        fuelType: form.fuelType,
        color: form.color || undefined,
        description: form.description || undefined,
        coverImageUrl: form.coverImageUrl || undefined,
        includes: includes.map(s => s.trim()).filter(Boolean),
        excludes: excludes.map(s => s.trim()).filter(Boolean),
        supplierId: form.supplierId || undefined,
        status: form.status,
        transmissionGears: form.transmissionGears ? Number(form.transmissionGears) : undefined,
        rates,
        // Structured add-on services — V14 migration backfilled legacy XSVC: rows.
        extraServices: extraServices
          .filter(s => s.name.trim())
          .map(s => ({
            name: s.name.trim(),
            priceCents: Math.round((parseFloat(s.priceUsd) || 0) * 100),
          })),
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
            <CoverImageInput
              value={form.coverImageUrl}
              onChange={url => setForm(f => ({ ...f, coverImageUrl: url }))}
            />

            {/* Inclusions / Exclusions — structured row lists with Add Item
                button (matches the Figma reference). Stored server-side as
                String[] just like the previous textarea encoding. */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-5">
              <RowList
                label="Inclusions"
                rows={includes}
                placeholder="e.g. GPS, Insurance, 24/7 support"
                onChange={setIncludes}
              />
              <RowList
                label="Exclusion"
                rows={excludes}
                placeholder="e.g. Fuel, Driver"
                onChange={setExcludes}
              />
            </div>
          </div>

          {/* Right: Form */}
          <div className="lg:col-span-2 bg-white p-10 rounded-3xl border border-slate-200 shadow-sm space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Registration No *</label>
                <input required type="text" placeholder="MU-1234-ABC" value={form.registrationNo}
                  onChange={e => setForm(f => ({ ...f, registrationNo: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none text-sm font-medium" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Car Name *</label>
                <input required type="text" placeholder="e.g. BMW X7" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
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
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status *</label>
                <div className="relative">
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as CarStatus }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none text-sm font-medium appearance-none">
                    {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Year *</label>
                <input required type="number" min={1990} max={2030} value={form.year}
                  onChange={e => setForm(f => ({ ...f, year: Number(e.target.value) }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none text-sm font-medium" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Passengers *</label>
                <input required type="number" min={1} max={30} value={form.passengerCapacity}
                  onChange={e => setForm(f => ({ ...f, passengerCapacity: Number(e.target.value) }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none text-sm font-medium" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Luggage Capacity</label>
                <input type="number" min={0} value={form.luggageCapacity}
                  onChange={e => setForm(f => ({ ...f, luggageCapacity: e.target.value }))}
                  placeholder="e.g. 3"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none text-sm font-medium" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Color</label>
                <input type="text" placeholder="Black" value={form.color}
                  onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
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
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Transmission (Gears)</label>
                <input type="number" min={1} max={12}
                  value={form.transmissionGears}
                  onChange={e => setForm(f => ({ ...f, transmissionGears: e.target.value }))}
                  placeholder="e.g. 6"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none text-sm font-medium" />
              </div>
              {suppliers.length > 0 && (
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Supplier</label>
                  <div className="relative">
                    <select value={form.supplierId} onChange={e => setForm(f => ({ ...f, supplierId: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none text-sm font-medium appearance-none">
                      <option value="">— None —</option>
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description</label>
              <textarea rows={3} placeholder="Vehicle details and highlights..." value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none text-sm font-medium resize-none" />
            </div>

            {/* Rental rates — shown for RENTAL and BOTH */}
            {showRental && (
              <div className="space-y-3 pt-6 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Rental Rates ($) — {usageType === 'BOTH' ? 'Time-based pricing for car rentals' : 'Time-based pricing'}
                </label>
                <p className="text-[11px] text-slate-500">Daily is required. Weekly/Monthly are auto-applied for rentals ≥ 7 / 28 days when set.</p>
                <div className="space-y-2">
                  {rentalRows.map((row, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-28 text-xs font-bold text-slate-500 uppercase tracking-wider">{row.period}</div>
                      <div className="flex-1 relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">$</span>
                        <input type="number" min={0} step={0.01} placeholder="0.00"
                          value={row.amountUsd}
                          onChange={e => updateRentalRow(idx, e.target.value)}
                          className="w-full pl-7 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none text-sm font-medium" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transfer bands — shown for TRANSFER and BOTH */}
            {showTransfer && (
              <div className="space-y-3 pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Transfer Per-KM Bands ($) {usageType === 'BOTH' && '— Distance-based pricing for transfers'}
                  </label>
                  <button type="button"
                    onClick={() => setTransferBands(prev => [...prev, { amountUsd: '', kmFrom: '', kmTo: '' }])}
                    className="text-[11px] font-bold text-brand-primary hover:underline flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add band
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">Bands must not overlap. Leave the last "to" blank for "and above".</p>
                <div className="space-y-2">
                  {transferBands.map((band, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-28 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        {band.kmFrom || '0'}–{band.kmTo || '∞'} km
                      </div>
                      <div className="flex-1 relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">$</span>
                        <input type="number" min={0} step={0.01} placeholder="0.00"
                          value={band.amountUsd}
                          onChange={e => updateTransferBand(idx, 'amountUsd', e.target.value)}
                          className="w-full pl-7 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none text-sm font-medium" />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <input type="number" min={0} placeholder="from" value={band.kmFrom}
                          onChange={e => updateTransferBand(idx, 'kmFrom', e.target.value)}
                          className="w-16 px-2 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none text-center" />
                        <span>to</span>
                        <input type="number" min={0} placeholder="∞" value={band.kmTo}
                          onChange={e => updateTransferBand(idx, 'kmTo', e.target.value)}
                          className="w-16 px-2 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none text-center" />
                      </div>
                      {transferBands.length > 1 && (
                        <button type="button"
                          onClick={() => setTransferBands(prev => prev.filter((_, i) => i !== idx))}
                          className="w-8 h-8 rounded-lg border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-300 flex items-center justify-center transition-colors"
                          aria-label="Remove band">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

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

            {/* Extra services — persisted in car_extra_services table (V14) */}
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
                      <input type="text" placeholder="Service name (e.g. Child Seat)"
                        value={svc.name}
                        onChange={e => updateExtraService(i, 'name', e.target.value)}
                        className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary outline-none" />
                      <div className="relative w-28">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                        <input type="number" min={0} step={0.01} placeholder="0.00"
                          value={svc.priceUsd}
                          onChange={e => updateExtraService(i, 'priceUsd', e.target.value)}
                          className="w-full pl-7 pr-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary outline-none" />
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

/**
 * Multi-row text-input list with "Add Item" button. Used for both Inclusions
 * and Exclusions on the Add/Edit Car form so admins can structure values
 * row-by-row instead of typing into a free-form textarea.
 */
function RowList({
  label, rows, placeholder, onChange,
}: { label: string; rows: string[]; placeholder?: string; onChange: (next: string[]) => void }) {
  const update = (idx: number, val: string) => onChange(rows.map((r, i) => i === idx ? val : r));
  const remove = (idx: number) => onChange(rows.length <= 1 ? [''] : rows.filter((_, i) => i !== idx));
  const add    = () => onChange([...rows, '']);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</label>
        <button type="button" onClick={add}
          className="flex items-center gap-1 text-brand-primary text-xs font-bold hover:underline">
          <Plus className="w-3.5 h-3.5" /> Add Item
        </button>
      </div>
      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="text"
              value={row}
              placeholder={placeholder}
              onChange={e => update(i, e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary outline-none"
            />
            <button type="button" onClick={() => remove(i)}
              className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              aria-label={`Remove ${label} item`}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
