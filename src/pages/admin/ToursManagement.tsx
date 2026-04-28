import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Edit, Trash2, RefreshCw, Download } from 'lucide-react';
import { adminListTours, adminDeleteTour, Tour } from '../../api/tours';
import { cn } from '../../lib/utils';

const CATEGORY_LABELS: Record<string, string> = { LAND: 'Land', SEA: 'Sea', AIR: 'Air' };
const DURATION_LABELS: Record<string, string> = { HALF_DAY: 'Half Day', FULL_DAY: 'Full Day' };
const REGION_LABELS: Record<string, string> = {
  NORTH: 'North', SOUTH: 'South', EAST: 'East', WEST: 'West', CENTRAL: 'Central'
};

export default function ToursManagement() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminListTours({ search: search || undefined, category: category || undefined, status: status || undefined, size: 50 });
      setTours(res.data ?? []);
      setTotal(res.meta?.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [search, category, status]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this tour?')) return;
    await adminDeleteTour(id);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold text-slate-800">Tours Management</h2>
          <p className="text-slate-500 mt-1">Curate and manage excursion packages</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const rows = [['Title', 'Category', 'Region', 'Duration', 'Adult Price ($', 'Status']];
              tours.forEach(t => rows.push([t.title, t.category, t.region, t.duration, String((t.adultPriceCents/100).toFixed(0)), t.status]));
              const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
              const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
              a.download = `tours-${new Date().toISOString().split('T')[0]}.csv`; a.click();
            }}
            className="flex items-center gap-2 bg-white text-slate-700 px-4 py-2.5 rounded-xl font-bold border border-slate-200 hover:bg-slate-50 transition-all shadow-sm"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <Link to="/admin/activities/add">
            <button className="flex items-center gap-2 bg-brand-primary text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-brand-primary/20 hover:scale-[1.02] transition-all">
              <Plus className="w-5 h-5" />
              Add Tour
            </button>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search tours..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-primary w-64"
              />
            </div>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="pl-4 pr-10 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-primary"
            >
              <option value="">All Categories</option>
              <option value="LAND">Land</option>
              <option value="SEA">Sea</option>
              <option value="AIR">Air</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-2">Status:</span>
            {(['', 'ACTIVE', 'ON_REQUEST', 'INACTIVE'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-bold",
                  status === s ? "bg-brand-primary text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {s === '' ? 'All' : s.replace('_', ' ')}
              </button>
            ))}
            <button onClick={load} className="p-2 text-slate-400 hover:text-slate-600">
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tour</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Region</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Adult Price</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400">Loading...</td></tr>
              ) : tours.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400">No tours found</td></tr>
              ) : tours.map(tour => (
                <tr key={tour.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {tour.coverImageUrl && (
                        <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                          <img src={tour.coverImageUrl} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-slate-700 text-sm">{tour.title}</p>
                        <p className="text-xs text-slate-400">{tour.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{CATEGORY_LABELS[tour.category] ?? tour.category}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{REGION_LABELS[tour.region] ?? tour.region}</td>
                  <td className="px-6 py-4 text-sm font-medium text-brand-primary">{DURATION_LABELS[tour.duration] ?? tour.duration}</td>
                  <td className="px-6 py-4 text-right font-display font-bold text-slate-800">
                    Rs {(tour.adultPriceCents / 100).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      tour.status === 'ACTIVE' ? "bg-green-50 text-green-600 border border-green-100"
                        : tour.status === 'ON_REQUEST' ? "bg-yellow-50 text-yellow-600 border border-yellow-100"
                        : "bg-slate-100 text-slate-500 border border-slate-200"
                    )}>
                      {tour.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-1">
                      <Link to={`/admin/activities/edit/${tour.id}`}>
                        <button className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg">
                          <Edit className="w-4 h-4" />
                        </button>
                      </Link>
                      <button
                        onClick={() => handleDelete(tour.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {total > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 text-sm text-slate-500">
            {total} tour{total !== 1 ? 's' : ''} total
          </div>
        )}
      </div>
    </div>
  );
}
