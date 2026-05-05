import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';

type ItineraryStop = { title: string; timeLabel: string; location: string; description: string };
type PickupZone = { zoneName: string; hotelName: string; pickupTimeFrom: string; pickupTimeTo: string };
type Highlight = string;

const REGIONS = ['NORTH', 'SOUTH', 'EAST', 'WEST', 'CENTRAL'];
const THEMES = ['NATURE', 'ADVENTURE', 'CULTURAL', 'SEA_ACTIVITIES', 'BEACH'];

export default function AddDayTrip() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '', region: 'NORTH', tripType: 'SHARED', theme: '', duration: 'FULL_DAY',
    availabilityMode: 'always', status: 'ACTIVE',
    pricePerVehicleCents: '', adultPriceCents: '', childPriceCents: '', netRatePerPaxCents: '', markupPct: '',
    maxPax: '', description: '',
    includes: [''], excludes: [''],
  });
  const [itinerary, setItinerary] = useState<ItineraryStop[]>([{ title: '', timeLabel: '', location: '', description: '' }]);
  const [pickupZones, setPickupZones] = useState<PickupZone[]>([{ zoneName: '', hotelName: '', pickupTimeFrom: '', pickupTimeTo: '' }]);
  const [highlights, setHighlights] = useState<Highlight[]>(['']);
  const [coverImage, setCoverImage] = useState<File | null>(null);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const uploadImage = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/v1/uploads', { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }, body: fd });
    const d = await res.json();
    return d.data?.url ?? '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      let coverImageUrl = '';
      if (coverImage) coverImageUrl = await uploadImage(coverImage);

      const payload = {
        title: form.title, region: form.region, tripType: form.tripType, theme: form.theme || null,
        duration: form.duration, availabilityMode: form.availabilityMode, status: form.status,
        pricePerVehicleCents: form.pricePerVehicleCents ? Number(form.pricePerVehicleCents) * 100 : 0,
        adultPriceCents: form.adultPriceCents ? Number(form.adultPriceCents) * 100 : 0,
        childPriceCents: form.childPriceCents ? Number(form.childPriceCents) * 100 : 0,
        netRatePerPaxCents: form.netRatePerPaxCents ? Number(form.netRatePerPaxCents) * 100 : 0,
        markupPct: form.markupPct ? Number(form.markupPct) : 0,
        maxPax: form.maxPax ? Number(form.maxPax) : 20,
        description: form.description,
        includes: form.includes.filter(Boolean),
        excludes: form.excludes.filter(Boolean),
        coverImageUrl,
        itineraryStops: itinerary.filter(s => s.title).map((s, i) => ({ ...s, stopOrder: i })),
        pickupZones: pickupZones.filter(z => z.zoneName),
        highlights: highlights.filter(Boolean).map((text, i) => ({ text, displayOrder: i })),
      };

      const res = await fetch('/api/v1/admin/day-trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        navigate('/admin/day-trips');
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d?.error?.message ?? d?.message ?? `Save failed (${res.status})`);
      }
    } catch (err: any) {
      setError(err?.message ?? 'Network error — could not save');
    } finally {
      setSaving(false);
    }
  };

  const listField = (
    label: string,
    items: string[],
    setItems: (items: string[]) => void
  ) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input type="text" value={item} onChange={e => { const n = [...items]; n[i] = e.target.value; setItems(n); }}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
            <button type="button" onClick={() => setItems(items.filter((_, j) => j !== i))} className="p-2 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-400" /></button>
          </div>
        ))}
        <button type="button" onClick={() => setItems([...items, ''])} className="flex items-center gap-1 text-sm text-brand-primary hover:text-brand-primary/80 font-medium">
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/admin/day-trips')} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5 text-gray-500" /></button>
        <h1 className="text-2xl font-bold text-gray-900">Add Local Experience</h1>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">Basic Information</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tour Name *</label>
            <input type="text" required value={form.title} onChange={e => set('title', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Region *</label>
              <select value={form.region} onChange={e => set('region', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary">
                {REGIONS.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
              <select value={form.tripType} onChange={e => set('tripType', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary">
                <option>SHARED</option><option>PRIVATE</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
              <select value={form.theme} onChange={e => set('theme', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary">
                <option value="">— Select Theme —</option>
                {THEMES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration *</label>
              <select value={form.duration} onChange={e => set('duration', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary">
                <option value="HALF_DAY">Half Day</option><option value="FULL_DAY">Full Day</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Availability Status</label>
              <select value={form.availabilityMode} onChange={e => set('availabilityMode', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary">
                <option value="always">Always Available</option>
                <option value="on_request">On Request</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary">
                <option>ACTIVE</option><option>INACTIVE</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image</label>
            <input type="file" accept="image/*" onChange={e => setCoverImage(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-primary/10 file:text-brand-primary hover:file:bg-brand-primary/20" />
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">Pricing</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adult Price (USD) *</label>
              <input type="number" min={0} step="0.01" required value={form.adultPriceCents} onChange={e => set('adultPriceCents', e.target.value)}
                placeholder="e.g. 220.00"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Child Price (USD)</label>
              <input type="number" min={0} step="0.01" value={form.childPriceCents} onChange={e => set('childPriceCents', e.target.value)}
                placeholder="leave blank to use adult price"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price Per Vehicle (USD)</label>
              <input type="number" min={0} step="0.01" value={form.pricePerVehicleCents} onChange={e => set('pricePerVehicleCents', e.target.value)}
                placeholder="for PRIVATE trips only"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Net Rate per Pax (USD)</label>
              <input type="number" min={0} step="0.01" value={form.netRatePerPaxCents} onChange={e => set('netRatePerPaxCents', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Markup (%)</label>
              <input type="number" min={0} max={100} value={form.markupPct} onChange={e => set('markupPct', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Pax *</label>
              <input type="number" min={1} required value={form.maxPax} onChange={e => set('maxPax', e.target.value)}
                placeholder="e.g. 20"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">Description</h2>
          <textarea rows={5} value={form.description} onChange={e => set('description', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none" />
          {listField('Inclusions', form.includes, items => setForm(f => ({ ...f, includes: items })))}
          {listField('Exclusions', form.excludes, items => setForm(f => ({ ...f, excludes: items })))}
        </div>

        {/* Key Highlights */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">Key Highlights</h2>
          <div className="flex flex-wrap gap-2 mb-2">
            {highlights.filter(Boolean).map((h, i) => (
              <span key={i} className="flex items-center gap-1 px-3 py-1 bg-brand-primary/10 text-brand-primary rounded-full text-sm">
                {h}
                <button type="button" onClick={() => setHighlights(highlights.filter((_, j) => j !== i))} className="ml-1 hover:text-brand-primary">×</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input type="text" placeholder="Add highlight…" value={highlights[highlights.length - 1] || ''}
              onChange={e => { const h = [...highlights]; h[h.length - 1] = e.target.value; setHighlights(h); }}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); setHighlights([...highlights.filter(Boolean), '']); }}}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
            <button type="button" onClick={() => setHighlights([...highlights.filter(Boolean), ''])} className="px-4 py-2 bg-brand-primary/10 text-brand-primary rounded-lg text-sm font-medium hover:bg-brand-primary/20">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Itinerary */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">Itinerary</h2>
          <div className="space-y-4">
            {itinerary.map((stop, i) => (
              <div key={i} className="border border-gray-100 rounded-lg p-4 relative">
                <button type="button" onClick={() => setItinerary(itinerary.filter((_, j) => j !== i))} className="absolute top-3 right-3 p-1 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4 text-red-400" /></button>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Title *</label>
                    <input type="text" value={stop.title} onChange={e => { const s = [...itinerary]; s[i] = { ...s[i], title: e.target.value }; setItinerary(s); }}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Time</label>
                    <input type="text" placeholder="e.g. 09:00" value={stop.timeLabel} onChange={e => { const s = [...itinerary]; s[i] = { ...s[i], timeLabel: e.target.value }; setItinerary(s); }}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Location</label>
                  <input type="text" value={stop.location} onChange={e => { const s = [...itinerary]; s[i] = { ...s[i], location: e.target.value }; setItinerary(s); }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Description</label>
                  <textarea rows={2} value={stop.description} onChange={e => { const s = [...itinerary]; s[i] = { ...s[i], description: e.target.value }; setItinerary(s); }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none" />
                </div>
              </div>
            ))}
            <button type="button" onClick={() => setItinerary([...itinerary, { title: '', timeLabel: '', location: '', description: '' }])}
              className="flex items-center gap-2 text-sm text-brand-primary hover:text-brand-primary/80 font-medium">
              <Plus className="w-4 h-4" /> Add Stop
            </button>
          </div>
        </div>

        {/* Pickup Zones */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">Pickup Zones</h2>
          <div className="space-y-4">
            {pickupZones.map((zone, i) => (
              <div key={i} className="border border-gray-100 rounded-lg p-4 relative">
                <button type="button" onClick={() => setPickupZones(pickupZones.filter((_, j) => j !== i))} className="absolute top-3 right-3 p-1 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4 text-red-400" /></button>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Zone Name *</label>
                    <input type="text" value={zone.zoneName} onChange={e => { const z = [...pickupZones]; z[i] = { ...z[i], zoneName: e.target.value }; setPickupZones(z); }}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Hotel Name</label>
                    <input type="text" value={zone.hotelName} onChange={e => { const z = [...pickupZones]; z[i] = { ...z[i], hotelName: e.target.value }; setPickupZones(z); }}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Pickup From</label>
                    <input type="time" value={zone.pickupTimeFrom} onChange={e => { const z = [...pickupZones]; z[i] = { ...z[i], pickupTimeFrom: e.target.value }; setPickupZones(z); }}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Pickup To</label>
                    <input type="time" value={zone.pickupTimeTo} onChange={e => { const z = [...pickupZones]; z[i] = { ...z[i], pickupTimeTo: e.target.value }; setPickupZones(z); }}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                  </div>
                </div>
              </div>
            ))}
            <button type="button" onClick={() => setPickupZones([...pickupZones, { zoneName: '', hotelName: '', pickupTimeFrom: '', pickupTimeTo: '' }])}
              className="flex items-center gap-2 text-sm text-brand-primary hover:text-brand-primary/80 font-medium">
              <Plus className="w-4 h-4" /> Add Zone
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate('/admin/day-trips')} className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors">Cancel</button>
          <button type="submit" disabled={saving} className="flex-1 bg-brand-primary text-white py-3 rounded-xl font-semibold hover:bg-brand-primary/90 disabled:opacity-50 transition-colors">
            {saving ? 'Saving…' : 'Publish Local Experience'}
          </button>
        </div>
      </form>
    </div>
  );
}
