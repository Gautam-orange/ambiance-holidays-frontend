import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, ChevronLeft, ImagePlus, X } from 'lucide-react';
import { adminCreateTour } from '../../api/tours';
import { cn } from '../../lib/utils';

interface ItineraryRow { stopTime: string; title: string; description: string; }
interface PickupRow { zoneName: string; extraCents: string; pickupTime: string; }

export default function AddTour() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '',
    category: 'LAND',
    region: 'NORTH',
    duration: 'FULL_DAY',
    durationHours: '',
    description: '',
    adultPriceCents: '',
    childPriceCents: '',
    infantPriceCents: '0',
    minPax: '1',
    maxPax: '20',
    includes: '',
    excludes: '',
    importantNotes: '',
    coverImageUrl: '',
    status: 'ACTIVE',
    availabilityMode: 'always',
    theme: 'NATURE',
  });

  const [itinerary, setItinerary] = useState<ItineraryRow[]>([{ stopTime: '', title: '', description: '' }]);
  const [pickups, setPickups] = useState<PickupRow[]>([]);
  const [uploading, setUploading] = useState(false);

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  /**
   * Upload a chosen image file to the backend and store the returned short URL
   * in the form. Avoids users pasting 30 KB+ base64 strings into a VARCHAR(500)
   * column (the prior "An unexpected error occurred" failure mode).
   */
  const handleImageUpload = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, or WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image is too large — please upload a file under 5 MB.');
      return;
    }
    setError('');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/v1/uploads', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        body: fd,
      });
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) throw new Error(data?.error?.message ?? `Upload failed (${res.status})`);
      const url = data?.data?.url;
      if (!url) throw new Error('Upload succeeded but no URL was returned.');
      set('coverImageUrl', url);
    } catch (e: any) {
      setError(e?.message ?? 'Could not upload image.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await adminCreateTour({
        title: form.title,
        category: form.category as any,
        region: form.region as any,
        duration: form.duration as any,
        durationHours: form.durationHours ? Number(form.durationHours) : undefined,
        description: form.description,
        adultPriceCents: Math.round(Number(form.adultPriceCents) * 100),
        childPriceCents: Math.round(Number(form.childPriceCents) * 100),
        infantPriceCents: Math.round(Number(form.infantPriceCents) * 100),
        minPax: Number(form.minPax) as any,
        maxPax: Number(form.maxPax) as any,
        includes: form.includes ? form.includes.split('\n').filter(Boolean) : undefined,
        excludes: form.excludes ? form.excludes.split('\n').filter(Boolean) : undefined,
        importantNotes: form.importantNotes ? form.importantNotes.split('\n').filter(Boolean) : undefined,
        coverImageUrl: form.coverImageUrl || undefined,
        status: form.status as any,
        theme: form.theme as any,
        availabilityMode: form.availabilityMode as any,
        itineraryStops: itinerary.filter(r => r.title).map((r, i) => ({
          stopTime: r.stopTime, title: r.title, description: r.description, sortOrder: i,
        })),
        pickupZones: pickups.filter(p => p.zoneName).map(p => ({
          zoneName: p.zoneName,
          extraCents: Math.round(Number(p.extraCents || 0) * 100),
          pickupTime: p.pickupTime || undefined,
        })),
      } as any);
      navigate('/admin/activities');
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? 'Failed to create tour');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 space-y-8">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-lg">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-3xl font-display font-bold text-slate-800">Create Tour</h2>
          <p className="text-slate-500 mt-1">Add a new excursion package</p>
        </div>
      </div>

      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
          <h3 className="font-bold text-slate-700">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Title *</label>
              <input required value={form.title} onChange={e => set('title', e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-primary" />
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</label>
              <textarea rows={4} value={form.description} onChange={e => set('description', e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-primary resize-none" />
            </div>
            {[
              { label: 'Category', key: 'category', options: ['LAND','SEA','AIR'] },
              { label: 'Region', key: 'region', options: ['NORTH','SOUTH','EAST','WEST','CENTRAL'] },
              { label: 'Duration', key: 'duration', options: ['HALF_DAY','FULL_DAY'] },
              { label: 'Theme', key: 'theme', options: ['NATURE','ADVENTURE','CULTURAL','SEA_ACTIVITIES','BEACH'] },
              { label: 'Availability', key: 'availabilityMode', options: ['always','on_request'] },
              { label: 'Status', key: 'status', options: ['ACTIVE','INACTIVE'] },
            ].map(({ label, key, options }) => (
              <div key={key} className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
                <select value={(form as any)[key]} onChange={e => set(key as any, e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-primary bg-white">
                  {options.map(o => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
            ))}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Duration Hours</label>
              <input type="number" step="0.5" value={form.durationHours} onChange={e => set('durationHours', e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-primary" />
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cover Image</label>
              {form.coverImageUrl ? (
                <div className="flex items-start gap-3">
                  <img
                    src={form.coverImageUrl}
                    alt="Cover preview"
                    className="w-32 h-24 object-cover rounded-xl border border-slate-200 bg-slate-100"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <div className="flex-1 min-w-0 space-y-2">
                    <p className="text-xs text-slate-500 truncate" title={form.coverImageUrl}>{form.coverImageUrl}</p>
                    <button
                      type="button"
                      onClick={() => set('coverImageUrl', '')}
                      className="inline-flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-700"
                    >
                      <X className="w-3 h-3" /> Remove
                    </button>
                  </div>
                </div>
              ) : (
                <label className={cn(
                  'flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm cursor-pointer transition-colors',
                  uploading ? 'opacity-60 cursor-wait' : 'hover:border-brand-primary hover:bg-brand-primary/5 text-slate-500'
                )}>
                  <ImagePlus className="w-4 h-4" />
                  <span>{uploading ? 'Uploading…' : 'Choose an image (JPG, PNG, WebP — max 5 MB)'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploading}
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                      e.target.value = '';
                    }}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>
        </section>

        {/* Pricing & Pax */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
          <h3 className="font-bold text-slate-700">Pricing & Capacity</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'Adult Price ($ *', key: 'adultPriceCents', required: true },
              { label: 'Child Price ($ *', key: 'childPriceCents', required: true },
              { label: 'Infant Price ($', key: 'infantPriceCents', required: false },
              { label: 'Min Pax', key: 'minPax', required: false },
              { label: 'Max Pax', key: 'maxPax', required: false },
            ].map(({ label, key, required }) => (
              <div key={key} className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
                <input type="number" min="0" required={required}
                  value={(form as any)[key]} onChange={e => set(key as any, e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-primary" />
              </div>
            ))}
          </div>
        </section>

        {/* Inclusions/Exclusions */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
          <h3 className="font-bold text-slate-700">Inclusions & Exclusions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Includes (one per line)', key: 'includes' },
              { label: 'Excludes (one per line)', key: 'excludes' },
              { label: 'Important Notes (one per line)', key: 'importantNotes' },
            ].map(({ label, key }) => (
              <div key={key} className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
                <textarea rows={4} value={(form as any)[key]} onChange={e => set(key as any, e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-primary resize-none" />
              </div>
            ))}
          </div>
        </section>

        {/* Itinerary */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-700">Itinerary Stops</h3>
            <button type="button" onClick={() => setItinerary(i => [...i, { stopTime: '', title: '', description: '' }])}
              className="flex items-center gap-1 text-xs font-bold text-brand-primary hover:underline">
              <Plus className="w-3 h-3" /> Add Stop
            </button>
          </div>
          {itinerary.map((row, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-start">
              <input placeholder="Time (e.g. 08:00)" value={row.stopTime}
                onChange={e => setItinerary(it => it.map((r, j) => j === i ? { ...r, stopTime: e.target.value } : r))}
                className="col-span-2 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-primary" />
              <input placeholder="Stop title *" value={row.title}
                onChange={e => setItinerary(it => it.map((r, j) => j === i ? { ...r, title: e.target.value } : r))}
                className="col-span-4 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-primary" />
              <input placeholder="Description" value={row.description}
                onChange={e => setItinerary(it => it.map((r, j) => j === i ? { ...r, description: e.target.value } : r))}
                className="col-span-5 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-primary" />
              <button type="button" onClick={() => setItinerary(it => it.filter((_, j) => j !== i))}
                className="col-span-1 p-2 text-slate-300 hover:text-red-400">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </section>

        {/* Pickup Zones */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-700">Pickup Zones</h3>
            <button type="button" onClick={() => setPickups(p => [...p, { zoneName: '', extraCents: '0', pickupTime: '' }])}
              className="flex items-center gap-1 text-xs font-bold text-brand-primary hover:underline">
              <Plus className="w-3 h-3" /> Add Zone
            </button>
          </div>
          {pickups.length === 0 && <p className="text-sm text-slate-400">No pickup zones added</p>}
          {pickups.map((row, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-start">
              <input placeholder="Zone name *" value={row.zoneName}
                onChange={e => setPickups(p => p.map((r, j) => j === i ? { ...r, zoneName: e.target.value } : r))}
                className="col-span-5 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-primary" />
              <input placeholder="Extra price ($" type="number" min="0" value={row.extraCents}
                onChange={e => setPickups(p => p.map((r, j) => j === i ? { ...r, extraCents: e.target.value } : r))}
                className="col-span-3 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-primary" />
              <input placeholder="Pickup time" type="time" value={row.pickupTime}
                onChange={e => setPickups(p => p.map((r, j) => j === i ? { ...r, pickupTime: e.target.value } : r))}
                className="col-span-3 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-primary" />
              <button type="button" onClick={() => setPickups(p => p.filter((_, j) => j !== i))}
                className="col-span-1 p-2 text-slate-300 hover:text-red-400">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </section>

        <div className="flex justify-end gap-4">
          <button type="button" onClick={() => navigate(-1)}
            className="px-8 py-3 bg-white text-slate-500 font-bold rounded-2xl border border-slate-200 hover:bg-slate-50">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className={cn("px-10 py-3 bg-brand-primary text-white font-bold rounded-2xl shadow-lg shadow-brand-primary/20 transition-all",
              saving ? "opacity-60 cursor-not-allowed" : "hover:bg-brand-secondary")}>
            {saving ? 'Publishing…' : 'Publish Tour'}
          </button>
        </div>
      </form>
    </div>
  );
}
