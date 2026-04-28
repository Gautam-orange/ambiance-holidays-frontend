import React, { useState, useEffect } from 'react';
import { Search, Check, Clock, UserCheck, Shield, ChevronRight, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useParams, useNavigate } from 'react-router-dom';
import driversApi, { Driver, STATUS_COLORS } from '../../api/drivers';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function AssigneeDriver() {
  const { id: bookingItemId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Minimal assignment form — in real usage from booking flow you'd pass dates
  const [form, setForm] = useState({
    carId: '',
    startAt: '',
    endAt: '',
    pickupAddress: '',
    dropoffAddress: '',
  });

  useEffect(() => {
    driversApi.list({ size: 50 })
      .then(res => setDrivers(res.data.data.items))
      .finally(() => setIsLoading(false));
  }, []);

  const handleAssign = async (driverId: string) => {
    if (!bookingItemId || !form.startAt || !form.endAt || !form.carId) {
      setError('Please fill in all required fields (car, start & end times).');
      return;
    }
    setError('');
    setAssigning(driverId);
    try {
      await driversApi.assignDriver(bookingItemId, {
        driverId,
        carId: form.carId,
        startAt: new Date(form.startAt).toISOString(),
        endAt: new Date(form.endAt).toISOString(),
        pickupAddress: form.pickupAddress,
        dropoffAddress: form.dropoffAddress,
      });
      navigate(-1);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? 'Assignment failed.');
      setAssigning(null);
    }
  };

  const filtered = drivers.filter(d =>
    !search ||
    d.fullName.toLowerCase().includes(search.toLowerCase()) ||
    d.phone.includes(search)
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-display font-bold text-slate-800 tracking-tight">Assign Driver</h2>
        <div className="text-sm font-medium text-slate-500 bg-white px-4 py-2 rounded-xl border border-slate-200">
          Booking Item: <span className="text-brand-primary font-bold font-mono">{bookingItemId?.slice(0, 8)}…</span>
        </div>
      </div>

      {/* Assignment details form */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <h3 className="font-display font-bold text-slate-700 mb-6">Assignment Details</h3>
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 mb-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Car ID *</label>
            <input type="text" placeholder="Car UUID" value={form.carId}
              onChange={e => setForm(f => ({ ...f, carId: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary text-sm font-mono" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Start Date & Time *</label>
            <input type="datetime-local" value={form.startAt}
              onChange={e => setForm(f => ({ ...f, startAt: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary text-sm" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">End Date & Time *</label>
            <input type="datetime-local" value={form.endAt}
              onChange={e => setForm(f => ({ ...f, endAt: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary text-sm" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Pickup Address</label>
            <input type="text" placeholder="e.g. SSR Airport" value={form.pickupAddress}
              onChange={e => setForm(f => ({ ...f, pickupAddress: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary text-sm" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Drop-off Address</label>
            <input type="text" placeholder="e.g. Sugar Beach Hotel" value={form.dropoffAddress}
              onChange={e => setForm(f => ({ ...f, dropoffAddress: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary text-sm" />
          </div>
        </div>
      </div>

      {/* Driver list */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-display font-bold text-slate-800">Select Driver</h3>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search driver..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-primary w-64" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Driver</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Experience</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">License</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-full" /></td>
                  ))}
                </tr>
              )) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-400">No drivers found.</td></tr>
              ) : filtered.map(driver => {
                const isBooked = driver.status === 'BOOKED';
                return (
                  <tr key={driver.id} className={cn("hover:bg-slate-50 transition-colors", isBooked && "opacity-60")}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 overflow-hidden flex-shrink-0">
                          {driver.photoUrl
                            ? <img src={driver.photoUrl} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs font-bold">
                                {driver.firstName[0]}{driver.lastName[0]}
                              </div>
                          }
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{driver.fullName}</p>
                          {driver.code && <p className="text-[10px] text-brand-primary font-bold">{driver.code}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{driver.phone}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-bold text-brand-primary text-sm">{driver.experienceYears}+ yrs</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <Shield className="w-3.5 h-3.5 text-slate-400" />
                        {driver.licenseNo}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn("text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider", STATUS_COLORS[driver.status])}>
                        {driver.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleAssign(driver.id)}
                        disabled={isBooked || assigning === driver.id}
                        className={cn(
                          "px-5 py-2 rounded-xl text-sm font-bold transition-all",
                          isBooked
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                            : "bg-brand-primary text-white hover:scale-[1.02] shadow-lg shadow-brand-primary/20 disabled:opacity-60"
                        )}
                      >
                        {assigning === driver.id ? <LoadingSpinner size="sm" /> : 'Assign'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
