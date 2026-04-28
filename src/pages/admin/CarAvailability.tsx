import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, Calendar, X, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import carsApi, { AvailabilityCalendar, CarCalendarRow } from '../../api/cars';

const MONTH_NAMES = ['January','February','March','April','May','June',
  'July','August','September','October','November','December'];

export default function CarAvailability() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [calendar, setCalendar] = useState<AvailabilityCalendar | null>(null);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [blockingCar, setBlockingCar] = useState<{ carId: string; name: string } | null>(null);
  const [blockFrom, setBlockFrom] = useState('');
  const [blockTo, setBlockTo] = useState('');
  const [blockReason, setBlockReason] = useState('BLOCKED');
  const [blockError, setBlockError] = useState('');
  const [isBlocking, setIsBlocking] = useState(false);

  const fetchCalendar = async () => {
    setIsLoading(true);
    try {
      const res = await carsApi.getAvailabilityCalendar(year, month);
      setCalendar(res.data.data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchCalendar(); }, [year, month]);

  const nav = (dir: -1 | 1) => {
    const d = new Date(year, month - 1 + dir, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
  };

  const isDayBlocked = (row: CarCalendarRow, day: number) => {
    const date = new Date(year, month - 1, day);
    return row.blockedRanges.some(r =>
      date >= new Date(r.dateFrom) && date <= new Date(r.dateTo)
    );
  };

  const getBlockInfo = (row: CarCalendarRow, day: number) => {
    const date = new Date(year, month - 1, day);
    return row.blockedRanges.find(r => date >= new Date(r.dateFrom) && date <= new Date(r.dateTo));
  };

  const handleUnblock = async (availabilityId: string) => {
    try { await carsApi.unblockDates(availabilityId); fetchCalendar(); } catch {}
  };

  const handleBlock = async () => {
    if (!blockingCar || !blockFrom || !blockTo) return;
    setBlockError(''); setIsBlocking(true);
    try {
      await carsApi.blockDates(blockingCar.carId, blockFrom, blockTo, blockReason);
      setBlockingCar(null); setBlockFrom(''); setBlockTo(''); setBlockReason('BLOCKED');
      fetchCalendar();
    } catch (err: any) {
      setBlockError(err?.response?.data?.error?.message ?? 'Failed to block dates.');
    } finally { setIsBlocking(false); }
  };

  const filteredCars = (calendar?.cars ?? []).filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.registrationNo.toLowerCase().includes(search.toLowerCase())
  );
  const days = Array.from({ length: calendar?.daysInMonth ?? 31 }, (_, i) => i + 1);
  const today = new Date();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => nav(-1)} className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all">
            <ChevronLeft className="w-5 h-5 text-slate-500" />
          </button>
          <div>
            <h2 className="text-3xl font-display font-bold text-slate-800">Car Availability</h2>
            <p className="text-slate-500 mt-1">Fleet scheduling and date blocking</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-slate-500 text-sm font-medium bg-white px-4 py-2 rounded-xl border border-slate-200">
            <Calendar className="w-4 h-4" />
            {MONTH_NAMES[month - 1]} {year}
          </div>
          <button onClick={() => nav(1)} className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all">
            <ChevronRight className="w-5 h-5 text-slate-500" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search vehicle..." value={search} onChange={e => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-primary w-72" />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-brand-primary">
              <div className="w-2.5 h-2.5 bg-brand-primary rounded-full" /> Available
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <div className="w-2.5 h-2.5 bg-slate-300 rounded-full" /> Blocked
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left table-fixed">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-64 sticky left-0 bg-slate-50">Vehicle</th>
                {days.map(d => {
                  const isToday = year === today.getFullYear() && month === today.getMonth() + 1 && d === today.getDate();
                  return (
                    <th key={d} className={cn("px-1 py-4 text-center text-[10px] font-bold uppercase tracking-tighter w-10 border-l border-slate-100",
                      isToday ? "text-brand-primary bg-brand-primary/5" : "text-slate-400")}>{d}</th>
                  );
                })}
                <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-24 text-center">Block</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4 sticky left-0 bg-white"><div className="h-10 bg-slate-100 rounded w-full" /></td>
                  {days.map(d => <td key={d} className="p-1 border-l border-slate-100"><div className="h-8 bg-slate-100 rounded" /></td>)}
                  <td className="px-4 py-4" />
                </tr>
              )) : filteredCars.length === 0 ? (
                <tr><td colSpan={days.length + 2} className="text-center py-16 text-slate-400 font-medium">
                  {search ? 'No vehicles match your search.' : 'No active vehicles found.'}
                </td></tr>
              ) : filteredCars.map(car => (
                <tr key={car.carId} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-3 sticky left-0 bg-white group-hover:bg-slate-50 z-10 shadow-[2px_0px_10px_-4px_rgba(0,0,0,0.1)]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 overflow-hidden ring-2 ring-transparent group-hover:ring-brand-primary/20 flex-shrink-0">
                        {car.coverImageUrl
                          ? <img src={car.coverImageUrl} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold">{car.name[0]}</div>}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{car.name}</p>
                        <p className="text-[10px] text-brand-primary font-bold uppercase">{car.registrationNo}</p>
                      </div>
                    </div>
                  </td>
                  {days.map(day => {
                    const blocked = isDayBlocked(car, day);
                    const info = blocked ? getBlockInfo(car, day) : null;
                    return (
                      <td key={day} className="p-1 border-l border-slate-100">
                        <div
                          className={cn("w-full h-8 rounded-lg flex items-center justify-center transition-all",
                            blocked ? "bg-slate-100 cursor-pointer hover:bg-red-50" : "bg-brand-primary/10 border border-brand-primary/20")}
                          onClick={() => blocked && info && handleUnblock(info.availabilityId)}
                          title={blocked ? `${info?.reason} — click to unblock` : 'Available'}
                        >
                          {!blocked && <div className="w-1.5 h-1.5 bg-brand-primary rounded-full shadow-[0_0_8px_rgba(0,188,212,0.6)]" />}
                          {blocked && <X className="w-3 h-3 text-slate-300" />}
                        </div>
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => { setBlockingCar({ carId: car.carId, name: car.name }); setBlockError(''); }}
                      className="text-xs font-bold text-brand-primary hover:underline whitespace-nowrap">
                      + Block
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {blockingCar && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-display font-bold text-slate-900">Block Dates — {blockingCar.name}</h3>
              <button onClick={() => setBlockingCar(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            {blockError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-sm text-red-600">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />{blockError}
              </div>
            )}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[['From', blockFrom, setBlockFrom], ['To', blockTo, setBlockTo]].map(([label, val, setter]) => (
                  <div key={label as string} className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label as string}</label>
                    <input type="date" value={val as string} onChange={e => (setter as (v: string) => void)(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary text-sm" />
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reason</label>
                <input type="text" value={blockReason} onChange={e => setBlockReason(e.target.value)}
                  placeholder="BLOCKED / MAINTENANCE / RESERVED"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary text-sm" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setBlockingCar(null)}
                className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-all">Cancel</button>
              <button onClick={handleBlock} disabled={isBlocking || !blockFrom || !blockTo}
                className="flex-1 py-3 bg-brand-primary text-white rounded-2xl font-bold shadow-lg shadow-brand-primary/20 disabled:opacity-60 transition-all">
                {isBlocking ? 'Blocking...' : 'Block Dates'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
