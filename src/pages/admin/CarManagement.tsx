import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, ChevronLeft, ChevronRight, Pencil, Trash2, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import carsApi, { Car, CarCategory, CarUsageType, formatPrice, getDailyRate } from '../../api/cars';
import { cn } from '../../lib/utils';

const USAGE_TYPES: { label: string; value: CarUsageType | '' }[] = [
  { label: 'All Types', value: '' },
  { label: 'Rental', value: 'RENTAL' },
  { label: 'Transfer', value: 'TRANSFER' },
  { label: 'Both', value: 'BOTH' },
];

function getTransferRate(car: Car): string {
  const r = car.rates.find(r => r.period === 'PER_KM' && r.kmFrom === 0);
  return r ? formatPrice(r.amountCents) + '/km' : '—';
}

export default function CarManagement() {
  const [cars, setCars] = useState<Car[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [usageType, setUsageType] = useState<CarUsageType | ''>('');
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const PAGE_SIZE = 10;

  const fetchCars = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await carsApi.list({
        page,
        size: PAGE_SIZE,
        search: search || undefined,
        usageType: usageType || undefined,
      });
      setCars(res.data.data.items);
      setTotal(res.data.data.meta.total);
    } catch {
      // keep previous state on error
    } finally {
      setIsLoading(false);
    }
  }, [page, search, usageType]);

  useEffect(() => { fetchCars(); }, [fetchCars]);

  useEffect(() => { setPage(0); }, [search, usageType]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this car? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await carsApi.delete(id);
      fetchCars();
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (id: string) => {
    setTogglingId(id);
    try {
      const res = await carsApi.toggleStatus(id);
      setCars(prev => prev.map(c => c.id === id ? res.data.data : c));
    } finally {
      setTogglingId(null);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold text-slate-800">Car Management</h2>
          <p className="text-slate-500 mt-1">Manage transport fleet and pricing</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const rows = [['Registration', 'Name', 'Category', 'Usage', 'Capacity', 'Status']];
              cars.forEach(c => rows.push([c.registrationNo, c.name, c.category, c.usageType, String(c.passengerCapacity), c.status]));
              const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
              const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
              a.download = `cars-${new Date().toISOString().split('T')[0]}.csv`; a.click();
            }}
            className="flex items-center gap-2 bg-white text-slate-700 px-4 py-2.5 rounded-xl font-bold border border-slate-200 hover:bg-slate-50 transition-all shadow-sm"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <Link to="/admin/cars/add">
            <button className="flex items-center gap-2 bg-brand-primary text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-brand-primary/20 hover:scale-[1.02] transition-all">
              <Plus className="w-5 h-5" />
              Add Car
            </button>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by registration or name…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-primary w-full"
            />
          </div>
          <select
            value={usageType}
            onChange={e => setUsageType(e.target.value as CarUsageType | '')}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-primary"
          >
            {USAGE_TYPES.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Reg. No', 'Vehicle', 'Category', 'Year', 'Pax', 'Bags', 'Usage Type', 'Per Day', 'Transfer/KM', 'Active', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 11 }).map((_, j) => (
                      <td key={j} className="px-5 py-4"><div className="h-4 bg-slate-100 rounded w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : cars.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-16 text-slate-400 font-medium">
                    No cars found. <Link to="/admin/cars/add" className="text-brand-primary underline">Add your first car.</Link>
                  </td>
                </tr>
              ) : (
                cars.map((car) => {
                  const dailyRate = getDailyRate(car);
                  const showPerDay = car.usageType === 'RENTAL' || car.usageType === 'BOTH';
                  const showTransfer = car.usageType === 'TRANSFER' || car.usageType === 'BOTH';
                  return (
                    <tr key={car.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-4 font-mono text-sm font-medium text-brand-primary whitespace-nowrap">{car.registrationNo}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                            {car.coverImageUrl
                              ? <img src={car.coverImageUrl} alt={car.name} className="w-full h-full object-cover" />
                              : <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-400 text-xs font-bold">{car.name[0]}</div>}
                          </div>
                          <p className="font-medium text-slate-700 text-sm">{car.name}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded font-medium uppercase">{car.category}</span>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-500 font-mono">{car.year}</td>
                      <td className="px-5 py-4 text-sm font-bold text-slate-700">{car.passengerCapacity}</td>
                      <td className="px-5 py-4 text-sm font-bold text-slate-700">{car.luggageCapacity ?? '—'}</td>
                      <td className="px-5 py-4 text-sm text-slate-600">
                        <span className="px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider bg-slate-50 border-slate-200">
                          {car.usageType}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm font-bold text-slate-800 whitespace-nowrap">
                        {showPerDay && dailyRate ? formatPrice(dailyRate.amountCents) : '—'}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600 whitespace-nowrap">
                        {showTransfer ? getTransferRate(car) : '—'}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => handleToggleStatus(car.id)}
                          disabled={togglingId === car.id}
                          className="inline-flex items-center h-5 w-10 rounded-full relative transition-colors"
                          style={{ background: car.status === 'ACTIVE' ? 'rgba(0,188,212,0.2)' : '#e2e8f0' }}
                        >
                          <div className={cn(
                            'absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full transition-all duration-300',
                            car.status === 'ACTIVE' ? 'right-1 bg-brand-primary' : 'left-1 bg-slate-400'
                          )} />
                        </button>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          <Link to={`/admin/cars/${car.id}`}>
                            <button className="p-2 text-slate-400 hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-all" title="Edit">
                              <Pencil className="w-4 h-4" />
                            </button>
                          </Link>
                          <button
                            onClick={() => handleDelete(car.id)}
                            disabled={deletingId === car.id}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-6 border-t border-slate-100 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {total === 0 ? 'No entries' : `Showing ${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, total)} of ${total}`}
          </p>
          <div className="flex items-center gap-1 font-medium">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = Math.max(0, Math.min(page - 2, totalPages - 5)) + i;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn(
                    "w-9 h-9 flex items-center justify-center rounded-lg text-sm",
                    p === page ? "bg-brand-primary text-white shadow-md" : "hover:bg-slate-100 text-slate-600"
                  )}
                >
                  {p + 1}
                </button>
              );
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
