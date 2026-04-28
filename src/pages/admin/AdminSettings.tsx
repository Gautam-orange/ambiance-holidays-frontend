import React, { useState, useEffect } from 'react';
import { Save, Loader2 } from 'lucide-react';

type Settings = Record<string, string>;

const SETTING_GROUPS = [
  {
    title: 'Site Information',
    keys: [
      { key: 'head_office_address', label: 'Head Office Address', type: 'text' },
      { key: 'phone_1', label: 'Phone 1', type: 'text' },
      { key: 'phone_2', label: 'Phone 2', type: 'text' },
      { key: 'email_general', label: 'General Email', type: 'email' },
      { key: 'email_reservations', label: 'Reservations Email', type: 'email' },
      { key: 'currency', label: 'Currency Code', type: 'text' },
      { key: 'currency_symbol', label: 'Currency Symbol', type: 'text' },
    ],
  },
  {
    title: 'Business Rules',
    keys: [
      { key: 'vat_rate', label: 'VAT Rate (%)', type: 'number' },
      { key: 'same_day_cutoff_hour', label: 'Same-Day Cutoff Hour (Mauritius local, 0–23)', type: 'number' },
      { key: 'cart_ttl_days', label: 'Cart TTL (days)', type: 'number' },
      { key: 'max_markup_percent', label: 'Max Markup % allowed', type: 'number' },
      { key: 'default_commission', label: 'Default Commission Rate (%)', type: 'number' },
    ],
  },
  {
    title: 'Cancellation Policy',
    keys: [
      { key: 'cancellation_free_hours', label: 'Free cancellation (hours before service)', type: 'number' },
      { key: 'cancellation_50pct_hours', label: '50% fee threshold (hours before service)', type: 'number' },
      { key: 'cancellation_75pct_hours', label: '75% fee threshold (hours before service)', type: 'number' },
      { key: 'cancellation_100pct_hours', label: '100% fee threshold (hours before service)', type: 'number' },
    ],
  },
];

export default function AdminSettings() {
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/v1/admin/settings', { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } })
      .then(r => r.json())
      .then(d => {
        const map: Settings = {};
        (d.data ?? []).forEach((s: { key: string; value: string }) => { map[s.key] = s.value; });
        setSettings(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const saveKey = async (key: string) => {
    setSaving(key);
    try {
      await fetch(`/api/v1/admin/settings/${key}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        body: JSON.stringify({ value: settings[key] }),
      });
      setSaved(key);
      setTimeout(() => setSaved(null), 2000);
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-brand-primary animate-spin" /></div>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">System Settings</h1>

      <div className="space-y-8">
        {SETTING_GROUPS.map(group => (
          <div key={group.title} className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-800 mb-5">{group.title}</h2>
            <div className="space-y-4">
              {group.keys.map(({ key, label, type }) => (
                <div key={key} className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                    <input
                      type={type}
                      value={settings[key] ?? ''}
                      onChange={e => setSettings(s => ({ ...s, [key]: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                  </div>
                  <button
                    onClick={() => saveKey(key)}
                    disabled={saving === key}
                    className="mt-6 flex items-center gap-1.5 px-4 py-2 bg-brand-primary text-white rounded-lg text-sm font-medium hover:bg-brand-primary/90 disabled:opacity-50 transition-colors"
                  >
                    {saving === key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    {saved === key ? 'Saved!' : 'Save'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
