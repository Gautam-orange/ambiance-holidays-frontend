import React, { useEffect, useState, useCallback } from 'react';
import { Search, Download, RefreshCw, ChevronRight, ChevronLeft } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { adminListBookings, Booking, formatMoney } from '../../api/bookings';
import { cn } from '../../lib/utils';
import apiClient from '../../api/client';

const STATUS_TABS = ['ALL', 'PENDING', 'CONFIRMED', 'CANCELLED', 'ENQUIRY'] as const;
type StatusTab = typeof STATUS_TABS[number];

const STATUS_STYLES: Record<string, string> = {
  PENDING:   'bg-yellow-50 text-yellow-600 border-yellow-100',
  CONFIRMED: 'bg-green-50 text-green-600 border-green-100',
  CANCELLED: 'bg-red-50 text-red-500 border-red-100',
};

const DATE_PRESETS = [
  { label: 'Today', days: 0 },
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
];

const PAGE_SIZE = 20;

function toISODate(d: Date) { return d.toISOString().split('T')[0]; }

export default function BookingsManagement() {
  const [params, setParams] = useSearchParams();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const statusTab = (params.get('tab') as StatusTab) || 'ALL';
  const search = params.get('q') || '';
  const agentId = params.get('agentId') || '';
  const dateFrom = params.get('from') || '';
  const dateTo = params.get('to') || '';
  const page = Number(params.get('page') || '0');

  const setParam = (key: string, val: string) => {
    const next = new URLSearchParams(params);
    if (val) next.set(key, val); else next.delete(key);
    next.delete('page');
    setParams(next);
  };

  const applyPreset = (days: number) => {
    const today = new Date();
    const from = new Date(today);
    from.setDate(today.getDate() - days);
    const next = new URLSearchParams(params);
    next.set('from', toISODate(from));
    next.set('to', toISODate(today));
    next.delete('page');
    setParams(next);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const isEnquiry = statusTab === 'ENQUIRY';
      const status = !isEnquiry && statusTab !== 'ALL' ? statusTab : undefined;
      const res = await adminListBookings({
        search: search || undefined,
        status,
        agentId: agentId || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        enquiry: isEnquiry ? true : undefined,
        page,
        size: PAGE_SIZE,
      });
      setBookings(res.data ?? []);
      setTotal(res.meta?.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [statusTab, search, agentId, dateFrom, dateTo, page]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const exportCsv = async () => {
    const token = localStorage.getItem('accessToken');
    const res = await fetch('/api/v1/admin/bookings/export?format=csv', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Bookings Management</h2>
          <p className="text-slate-500 mt-1">Review and manage travel reservations</p>
        </div>
        <button onClick={exportCsv} className="flex items-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-primary/90 transition-all">
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Tabs + filters */}
        <div className="p-5 border-b border-slate-100 space-y-4">
          {/* Status tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl w-fit gap-1">
            {STATUS_TABS.map(t => (
              <button key={t} onClick={() => setParam('tab', t === 'ALL' ? '' : t)}
                className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  statusTab === t || (t === 'ALL' && statusTab === 'ALL')
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700')}>
                {t === 'ALL' ? 'All' : t.charAt(0) + t.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Search + date + agent filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Search by reference…"
                value={search} onChange={e => setParam('q', e.target.value)}
                className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-primary w-56" />
            </div>

            {/* Date presets */}
            <div className="flex gap-1">
              {DATE_PRESETS.map(p => (
                <button key={p.label} onClick={() => applyPreset(p.days)}
                  className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
                  {p.label}
                </button>
              ))}
            </div>

            {/* Custom date range */}
            <input type="date" value={dateFrom} onChange={e => setParam('from', e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-primary" />
            <span className="text-slate-400 text-sm">–</span>
            <input type="date" value={dateTo} onChange={e => setParam('to', e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-primary" />

            <button onClick={load} className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50">
              <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Booking ID', 'Customer', 'WhatsApp', 'Order Type', 'Cancel Reason', 'Booking Date', 'Total', 'Status', ''].map(h => (
                  <th key={h} className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={9} className="px-6 py-12 text-center text-slate-400">Loading…</td></tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <p className="text-slate-400 mb-2">No bookings match your filters</p>
                    <button onClick={() => setParams(new URLSearchParams())} className="text-brand-primary text-sm font-medium hover:underline">Reset filters</button>
                  </td>
                </tr>
              ) : bookings.map(b => (
                <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4 font-bold text-brand-primary text-sm whitespace-nowrap">
                    <Link to={`/admin/bookings/${b.id}`} className="hover:underline">{b.reference}</Link>
                    {b.isEnquiry && (
                      <span className="ml-2 px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px] font-medium">
                        Enquiry
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-slate-800 text-sm">{b.customerName}</p>
                    <p className="text-xs text-slate-400">{b.customerEmail}</p>
                    {b.agentName && (
                      <p className="text-[10px] text-brand-primary mt-0.5">via {b.agentName}</p>
                    )}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">{b.customerPhone ?? '—'}</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1">
                      {(b.items ?? []).map((item, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium">
                          {item.itemType?.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-500 max-w-[160px]">
                    {b.cancelReason ? (
                      <span className="block truncate" title={b.cancelReason}>
                        {b.cancelledByType ? <strong>By {b.cancelledByType}: </strong> : null}
                        {b.cancelReason}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600 whitespace-nowrap">{b.serviceDate}</td>
                  <td className="px-5 py-4 font-bold text-slate-800 text-sm whitespace-nowrap">
                    {formatMoney(b.totalCents)}
                  </td>
                  <td className="px-5 py-4">
                    <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border',
                      STATUS_STYLES[b.status] ?? 'bg-slate-100 text-slate-500 border-slate-200')}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      {b.isEnquiry && b.status === 'PENDING' && (
                        <>
                          <button
                            onClick={async () => {
                              await apiClient.post(`/admin/enquiries/${b.id}/convert`);
                              load();
                            }}
                            className="px-2 py-1 text-[10px] font-medium bg-green-50 text-green-700 rounded hover:bg-green-100"
                          >
                            Convert
                          </button>
                          <button
                            onClick={async () => {
                              const reason = prompt('Decline reason:');
                              if (!reason) return;
                              await apiClient.post(`/admin/enquiries/${b.id}/decline`, { reason });
                              load();
                            }}
                            className="px-2 py-1 text-[10px] font-medium bg-red-50 text-red-700 rounded hover:bg-red-100"
                          >
                            Decline
                          </button>
                        </>
                      )}
                      <Link to={`/admin/bookings/${b.id}`}>
                        <button className="p-2 text-slate-400 hover:text-brand-primary hover:bg-brand-primary/5 rounded-lg">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-sm text-slate-500">{total} booking{total !== 1 ? 's' : ''}</p>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 0}
                onClick={() => setParam('page', String(Math.max(0, page - 1)))}
                className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-slate-600">Page {page + 1} of {totalPages}</span>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setParam('page', String(page + 1))}
                className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
