import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';

type ItineraryStop = { title: string; timeLabel: string; location: string; description: string };
type PickupZone = { zoneName: string; hotelName: string; pickupTimeFrom: string; pickupTimeTo: string };

const REGIONS = ['NORTH', 'SOUTH', 'EAST', 'WEST', 'CENTRAL'];
const THEMES = ['NATURE', 'ADVENTURE', 'CULTURAL', 'SEA_ACTIVITIES', 'BEACH'];

export default function EditDayTrip() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '', region: 'NORTH', tripType: 'SHARED', theme: '', duration: 'FULL_DAY',
    availabilityMode: 'always', status: 'ACTIVE',
    pricePerVehicleCents: '', adultPriceCents: '', netRatePerPaxCents: '', markupPct: '',
    maxPax: '', description: '',
    includes: [''], excludes: [''],
  });
  const [itinerary, setItinerary] = useState<ItineraryStop[]>([]);
  const [pickupZones, setPickupZones] = useState<PickupZone[]>([]);
  const [highlights, setHighlights] = useState<string[]>(['']);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!id) return;
    fetch(`/api/v1/admin/day-trips/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
    })
      .then(r => r.json())
      .then(res => {
        const t = res.data ?? res;
        setForm({
          title: t.title ?? '',
          region: t.region ?? 'NORTH',
          tripType: t.tripType ?? 'SHARED',
          theme: t.theme ?? '',
          duration: t.duration ?? 'FULL_DAY',
          availabilityMode: t.availabilityMode ?? 'always',
          status: t.status ?? 'ACTIVE',
          pricePerVehicleCents: t.pricePerVehicleCents ? String(t.pricePerVehicleCents / 100) : '',
          adultPriceCents: t.adultPriceCents ? String(t.adultPriceCents / 100) : '',
          netRatePerPaxCents: t.netRatePerPaxCents ? String(t.netRatePerPaxCents / 100) : '',
          markupPct: t.markupPct != null ? String(t.markupPct) : '',
          maxPax: t.maxPax != null ? String(t.maxPax) : '',
          description: t.description ?? '',
          includes: Array.isArray(t.includes) && t.includes.length ? t.includes : [''],
          excludes: Array.isArray(t.excludes) && t.excludes.length ? t.excludes : [''],
        });
        setItinerary((t.itineraryStops ?? []).map((s: any) => ({
          title: s.title ?? '', timeLabel: s.timeLabel ?? s.stopTime ?? '',
          location: s.location ?? '', description: s.description ?? '',
        })));
        setPickupZones((t.pickupZones ?? []).map((z: any) => ({
          zoneName: z.zoneName ?? '', hotelName: z.hotelName ?? '',
          pickupTimeFrom: z.pickupTimeFrom ?? z.pickupTime ?? '', pickupTimeTo: z.pickupTimeTo ?? '',
        })));
        setHighlights((t.highlights ?? []).map((h: any) => h.text ?? h).concat(['']));
      })
      .catch(() => setError('Failed to load day trip'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    setError('');
    try {
      const payload = {
        title: form.title, region: form.region, tripType: form.tripType,
        theme: form.theme || null, duration: form.duration,
        availabilityMode: form.availabilityMode, status: form.status,
        pricePerVehicleCents: form.pricePerVehicleCents ? Number(form.pricePerVehicleCents) * 100 : 0,
        adultPriceCents: form.adultPriceCents ? Number(form.adultPriceCents) * 100 : 0,
        netRatePerPaxCents: form.netRatePerPaxCents ? Number(form.netRatePerPaxCents) * 100 : 0,
        markupPct: form.markupPct ? Number(form.markupPct) : 0,
        maxPax: form.maxPax ? Number(form.maxPax) : 20,
        description: form.description,
        includes: form.includes.filter(Boolean),
        excludes: form.excludes.filter(Boolean),
        itineraryStops: itinerary.filter(s => s.title).map((s, i) => ({ ...s, stopOrder: i })),
        pickupZones: pickupZones.filter(z => z.zoneName),
        highlights: highlights.filter(Boolean).map((text, i) => ({ text, displayOrder: i })),
      };

      const res = await fetch(`/api/v1/admin/day-trips/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) navigate('/admin/day-trips');
      else setError('Failed to save day trip');
    } finally {
      setSaving(false);
    }
  };

  const listField = (
    label: string, items: string[], setItems: (items: string[]) => void
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

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/admin/day-trips')} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5 text-gray-500" /></button>
        <h1 className="text-2xl font-bold text-gray-900">Edit Day Trip</h1>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-8">
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
              <select value={form.availabilityMode} onChange={e => set('availabilityMode', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary">
                <option value="always">Always Available</option><option value="on_request">On Request</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary">
                <option>ACTIVE</option><option>INACTIVE</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">Pricing</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Price Per Vehicle ($', key: 'pricePerVehicleCents' },
              { label: 'Price Per Passenger ($', key: 'adultPriceCents' },
              { label: 'Net Rate per Pax ($', key: 'netRatePerPaxCents' },
              { label: 'Markup (%)', key: 'markupPct' },
              { label: 'Max Pax', key: 'maxPax' },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input type="number" min={0} value={(form as any)[key]} onChange={e => set(key, e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">Description</h2>
          <textarea rows={5} value={form.description} onChange={e => set('description', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none" />
          {listField('Inclusions', form.includes, items => setForm(f => ({ ...f, includes: items })))}
          {listField('Exclusions', form.excludes, items => setForm(f => ({ ...f, excludes: items })))}
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate('/admin/day-trips')} className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors">Cancel</button>
          <button type="submit" disabled={saving} className="flex-1 bg-brand-primary text-white py-3 rounded-xl font-semibold hover:bg-brand-primary/90 disabled:opacity-50 transition-colors">
            {saving ? 'Saving…' : 'Save Day Trip'}
          </button>
        </div>
      </form>
    </div>
  );
}
