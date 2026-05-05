import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, ToggleLeft, ToggleRight, Download } from 'lucide-react';
import apiClient from '../../api/client';

type DayTrip = {
  id: string;
  code: string;
  title: string;
  region: string;
  tripType: 'SHARED' | 'PRIVATE';
  theme: string;
  adultPriceCents: number;
  duration: string;
  availabilityMode: 'always' | 'on_request';
  status: 'ACTIVE' | 'INACTIVE';
};

const fmt = (c: number) => `Rs ${(c / 100).toLocaleString()}`;

export default function DayTripManagement() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<DayTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetch_ = () => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    apiClient.get('/admin/day-trips', { params })
      .then(r => setTrips(r.data?.data?.content ?? r.data?.data?.items ?? r.data?.data ?? []))
      .catch(() => setTrips([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch_(); }, [search, statusFilter]);

  const toggleStatus = async (id: string, current: string) => {
    await apiClient.patch(`/admin/day-trips/${id}/status`, { status: current === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' });
    fetch_();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await apiClient.delete(`/admin/day-trips/${deleteId}`);
    setDeleteId(null);
    fetch_();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Local Experience Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage local experiences and excursions</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const rows = [['Title','Region','Type','Theme','Price ($','Duration','Status']];
              trips.forEach(t => rows.push([t.title,t.region,t.tripType,t.theme||'',String((t.adultPriceCents/100).toFixed(0)),t.duration,t.status]));
              const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
              const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
              a.download = `day-trips-${new Date().toISOString().split('T')[0]}.csv`; a.click();
            }}
            className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm"
          >
            <Download className="w-4 h-4" /> Export
          </button>
          <Link to="/admin/day-trips/add" className="flex items-center gap-2 bg-brand-primary text-white px-4 py-2.5 rounded-lg font-medium hover:bg-brand-primary/90 transition-colors text-sm">
            <Plus className="w-4 h-4" /> Add Local Experience
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search trips…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary">
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Trip ID</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Region</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Theme</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Price</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Duration</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={10} className="px-4 py-12 text-center text-gray-400">Loading…</td></tr>
            ) : trips.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center">
                  <p className="text-gray-400 mb-3">No local experiences added yet</p>
                  <Link to="/admin/day-trips/add" className="text-brand-primary font-medium hover:underline text-sm">Add your first local experience</Link>
                </td>
              </tr>
            ) : trips.map(trip => (
              <tr key={trip.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{trip.code || trip.id.slice(0, 8)}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{trip.title}</td>
                <td className="px-4 py-3 text-gray-600">{trip.region}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${trip.tripType === 'SHARED' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{trip.tripType}</span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{trip.theme?.replace('_', ' ') || '—'}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{fmt(trip.adultPriceCents)}</td>
                <td className="px-4 py-3 text-gray-600">{trip.duration?.replace('_', ' ')}</td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleStatus(trip.id, trip.status)} className="focus:outline-none">
                    {trip.status === 'ACTIVE'
                      ? <ToggleRight className="w-8 h-8 text-brand-primary" />
                      : <ToggleLeft className="w-8 h-8 text-gray-300" />}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => navigate(`/admin/day-trips/${trip.id}/edit`)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><Edit className="w-4 h-4 text-gray-500" /></button>
                    <button onClick={() => setDeleteId(trip.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4 text-red-400" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete confirmation modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="font-semibold text-gray-900 mb-2">Delete Local Experience?</h3>
            <p className="text-sm text-gray-500 mb-5">This action cannot be undone. Any future bookings for this trip must be cancelled first.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
