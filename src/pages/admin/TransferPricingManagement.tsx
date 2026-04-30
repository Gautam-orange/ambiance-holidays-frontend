import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Check, X, DollarSign, Ruler } from 'lucide-react';
import apiClient from '../../api/client';

interface Tier {
  id: string;
  label: string;
  minKm: number;
  maxKm: number | null;
  priceCents: number;
  active: boolean;
  sortOrder: number;
  includes: string[];
  excludes: string[];
}

const emptyForm = (): Omit<Tier, 'id'> & { includesText: string; excludesText: string } => ({
  label: '',
  minKm: 0,
  maxKm: null,
  priceCents: 0,
  active: true,
  sortOrder: 0,
  includes: [],
  excludes: [],
  // Working text for the textareas — split into the array on save.
  includesText: '',
  excludesText: '',
});

const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export default function TransferPricingManagement() {
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    apiClient.get('/admin/transfer-pricing')
      .then(r => setTiers(r.data.data ?? []))
      .catch(() => setError('Failed to load pricing tiers'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const startEdit = (t: Tier) => {
    setEditId(t.id);
    setForm({
      label: t.label,
      minKm: t.minKm,
      maxKm: t.maxKm,
      priceCents: t.priceCents,
      active: t.active,
      sortOrder: t.sortOrder,
      includes: t.includes ?? [],
      excludes: t.excludes ?? [],
      includesText: (t.includes ?? []).join('\n'),
      excludesText: (t.excludes ?? []).join('\n'),
    });
    setShowAdd(false);
  };

  const cancelEdit = () => { setEditId(null); setForm(emptyForm()); };

  const handleSave = async (id?: string) => {
    setSaving(true);
    setError('');
    try {
      const { includesText, excludesText, ...rest } = form;
      const payload = {
        ...rest,
        includes: includesText.split('\n').map(s => s.trim()).filter(Boolean),
        excludes: excludesText.split('\n').map(s => s.trim()).filter(Boolean),
      };
      if (id) {
        await apiClient.put(`/admin/transfer-pricing/${id}`, payload);
      } else {
        await apiClient.post('/admin/transfer-pricing', payload);
      }
      setEditId(null);
      setShowAdd(false);
      setForm(emptyForm());
      load();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this pricing tier?')) return;
    try {
      await apiClient.delete(`/admin/transfer-pricing/${id}`);
      load();
    } catch {
      setError('Delete failed');
    }
  };

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-brand-primary/20';

  const TierForm = ({ id }: { id?: string }) => (
    <div className="p-4 bg-slate-50 rounded-xl border border-brand-primary/20 space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 items-end">
        <div className="md:col-span-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Label</label>
          <input className={inputCls} placeholder="e.g. Short Distance (0–20 km)" value={form.label}
            onChange={e => setForm(f => ({ ...f, label: e.target.value }))} />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Min KM</label>
          <input type="number" min="0" className={inputCls} value={form.minKm}
            onChange={e => setForm(f => ({ ...f, minKm: Number(e.target.value) }))} />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Max KM <span className="text-slate-300">(blank=∞)</span></label>
          <input type="number" min="0" className={inputCls} placeholder="∞"
            value={form.maxKm ?? ''}
            onChange={e => setForm(f => ({ ...f, maxKm: e.target.value === '' ? null : Number(e.target.value) }))} />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Price (USD)</label>
          <input type="number" min="0" step="0.01" className={inputCls}
            value={form.priceCents / 100}
            onChange={e => setForm(f => ({ ...f, priceCents: Math.round(Number(e.target.value) * 100) }))} />
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleSave(id)} disabled={saving}
            className="flex-1 bg-brand-primary text-white py-2 rounded-lg text-sm font-bold hover:bg-brand-secondary disabled:opacity-60 flex items-center justify-center gap-1">
            <Check className="w-3.5 h-3.5" /> {saving ? '...' : 'Save'}
          </button>
          <button onClick={cancelEdit} className="px-3 py-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* What's Included / Exclusions — surfaced on the customer-facing transfer detail page. */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">What's Included <span className="text-slate-300 normal-case font-medium">(one per line)</span></label>
          <textarea
            rows={4}
            className={`${inputCls} resize-y`}
            placeholder={'Meet & greet at airport\nProfessional driver\nFuel & parking'}
            value={form.includesText}
            onChange={e => setForm(f => ({ ...f, includesText: e.target.value }))}
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Exclusions <span className="text-slate-300 normal-case font-medium">(one per line)</span></label>
          <textarea
            rows={4}
            className={`${inputCls} resize-y`}
            placeholder={'Gratuities\nTravel insurance\nMeals'}
            value={form.excludesText}
            onChange={e => setForm(f => ({ ...f, excludesText: e.target.value }))}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Transfer Pricing</h1>
          <p className="text-slate-500 text-sm mt-1">
            Define distance-based price tiers. Price is auto-calculated from the straight-line distance between pickup and drop-off.
          </p>
        </div>
        <button
          onClick={() => { setShowAdd(true); setEditId(null); setForm(emptyForm()); }}
          className="flex items-center gap-2 bg-brand-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-brand-secondary shadow-lg shadow-brand-primary/20"
        >
          <Plus className="w-4 h-4" /> Add Tier
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 border border-red-200 rounded-xl p-4 text-sm mb-6">{error}</div>
      )}

      {/* How it works */}
      <div className="bg-brand-primary/5 border border-brand-primary/20 rounded-2xl p-5 mb-8 flex gap-4 text-sm text-slate-600">
        <div className="flex gap-4 flex-wrap">
          <div className="flex items-start gap-2">
            <Ruler className="w-4 h-4 text-brand-primary mt-0.5 shrink-0" />
            <div><p className="font-semibold text-slate-800">How pricing works</p>
              <p>When a customer books a transfer, the system calculates the straight-line distance between their pickup and drop-off locations, then applies the first matching tier below.</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <DollarSign className="w-4 h-4 text-brand-primary mt-0.5 shrink-0" />
            <div><p className="font-semibold text-slate-800">No overlap needed</p>
              <p>Tiers are matched in order of Min KM. If no tier covers the distance, the customer is shown "price on request".</p>
            </div>
          </div>
        </div>
      </div>

      {showAdd && (
        <div className="mb-4">
          <TierForm />
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="bg-white rounded-2xl h-20 animate-pulse border border-slate-100" />)}
        </div>
      ) : tiers.length === 0 && !showAdd ? (
        <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-100">
          <Ruler className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-bold">No pricing tiers defined</p>
          <p className="text-sm mt-1">Click "Add Tier" to create your first distance-based price.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tiers.map(tier => (
            <div key={tier.id}>
              {editId === tier.id ? (
                <TierForm id={tier.id} />
              ) : (
                <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-6 shadow-sm hover:shadow-md transition-shadow">
                  {/* Distance badge */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center">
                      <Ruler className="w-5 h-5 text-brand-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Distance</p>
                      <p className="font-display font-bold text-brand-primary text-lg leading-tight">
                        {tier.minKm} – {tier.maxKm != null ? tier.maxKm : '∞'} km
                      </p>
                    </div>
                  </div>

                  {/* Label */}
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800">{tier.label}</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${tier.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                      {tier.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Price */}
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Price</p>
                    <p className="text-2xl font-display font-bold text-brand-primary">{fmt(tier.priceCents)}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => startEdit(tier)}
                      className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:text-brand-primary hover:border-brand-primary transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(tier.id)}
                      className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:text-red-500 hover:border-red-300 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
