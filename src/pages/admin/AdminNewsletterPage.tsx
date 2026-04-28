import React, { useState, useEffect } from 'react';
import { Download, Trash2, Loader2 } from 'lucide-react';

type Subscriber = { id: string; email: string; subscribedAt: string; confirmedAt: string | null; isActive: boolean };

export default function AdminNewsletterPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch_ = () => {
    setLoading(true);
    fetch('/api/v1/admin/newsletter', { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } })
      .then(r => r.json())
      .then(d => setSubscribers(d.data?.content ?? []))
      .catch(() => setSubscribers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch_(); }, []);

  const exportCsv = () => {
    fetch('/api/v1/admin/newsletter/export', { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } })
      .then(r => r.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `newsletter-subscribers-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      });
  };

  const unsubscribe = async (id: string) => {
    await fetch(`/api/v1/admin/newsletter/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
    });
    fetch_();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Newsletter Subscribers</h1>
          <p className="text-sm text-gray-500 mt-1">{subscribers.filter(s => s.isActive && s.confirmedAt).length} active confirmed subscribers</p>
        </div>
        <button onClick={exportCsv} className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Subscribed</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Confirmed</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center"><Loader2 className="w-5 h-5 animate-spin text-gray-300 mx-auto" /></td></tr>
            ) : subscribers.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400">No subscribers yet</td></tr>
            ) : subscribers.map(sub => (
              <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-900">{sub.email}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{new Date(sub.subscribedAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {sub.confirmedAt ? new Date(sub.confirmedAt).toLocaleDateString() : <span className="text-amber-600">Pending</span>}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sub.isActive && sub.confirmedAt ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {sub.isActive && sub.confirmedAt ? 'Active' : sub.isActive ? 'Unconfirmed' : 'Unsubscribed'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => unsubscribe(sub.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors" title="Unsubscribe">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
