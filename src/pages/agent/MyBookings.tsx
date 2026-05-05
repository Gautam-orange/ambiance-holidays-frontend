import React, { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import {
  Search, FileText, Download, Clock, CheckCircle, XCircle,
  RefreshCw, AlertCircle, ChevronDown, ChevronUp,
  MapPin, Users, Calendar, Star, Tag, Briefcase
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { cancelBooking, formatMoney, type Booking } from '../../api/bookings';
import apiClient from '../../api/client';

// ─── Status config ───────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, { icon: React.ElementType; cls: string; label: string }> = {
  PENDING:   { icon: Clock,        cls: 'text-amber-600 bg-amber-50 border-amber-100',  label: 'Pending' },
  CONFIRMED: { icon: CheckCircle,  cls: 'text-green-600 bg-green-50 border-green-100',  label: 'Confirmed' },
  CANCELLED: { icon: XCircle,      cls: 'text-red-500   bg-red-50   border-red-100',    label: 'Cancelled' },
};

const ITEM_LABELS: Record<string, string> = {
  CAR_RENTAL: 'Car Rental', CAR_TRANSFER: 'Transfer',
  TOUR: 'Tour', DAY_TRIP: 'Local Experience', HOTEL: 'Hotel',
};

// ─── Normalise any backend response shape into a flat bookings array ─────────
function normalise(res: unknown): { bookings: Booking[]; total: number } {
  const r = res as any; // intentional — backend shape is unknown at runtime
  // Shape: { data: [...], meta: {...} }
  if (r && Array.isArray(r.data)) {
    return { bookings: (r.data as Booking[]), total: (r.meta?.total as number | undefined) ?? r.data.length };
  }
  // Shape: { data: { items: [...], meta: {...} } }
  if (r?.data?.items && Array.isArray(r.data.items)) {
    return { bookings: (r.data.items as Booking[]), total: (r.data.meta?.total as number | undefined) ?? r.data.items.length };
  }
  // Shape: [...] (bare array)
  if (Array.isArray(r)) {
    return { bookings: (r as Booking[]), total: r.length };
  }
  return { bookings: [], total: 0 };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getSelectedExtras(item: any): { name: string; priceCents: number }[] {
  if (!item?.extras?.length) return [];
  return item.extras
    .filter((e: any) => e && (e.label || e.name))
    .map((e: any) => ({
      name: String(e.label ?? e.name ?? ''),
      priceCents: Number.isFinite(e.unitPriceCents) ? e.unitPriceCents
                : Number.isFinite(e.priceCents) ? e.priceCents
                : 0,
    }));
}


// ─── Expandable booking row ───────────────────────────────────────────────────
function BookingRow({
  booking,
  onCancel,
  onDownload,
}: {
  booking: Booking;
  onCancel: (id: string) => Promise<void>;
  onDownload: (id: string, ref: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const s = STATUS_STYLES[booking.status] ?? STATUS_STYLES.PENDING;
  const Icon = s.icon;

  // Defensive defaults — never crash on missing/null fields from the API.
  const items       = Array.isArray(booking.items) ? booking.items : [];
  const totalCents  = Number.isFinite(booking.totalCents) ? booking.totalCents : 0;
  const markupCents = Number.isFinite(booking.markupCents) ? booking.markupCents : 0;
  const customerName  = booking.customerName  ?? '—';
  const customerEmail = booking.customerEmail ?? '';
  const reference     = booking.reference     ?? '—';
  const createdAt     = booking.createdAt     ?? '';

  return (
    <>
      {/* Summary row */}
      <tr
        onClick={() => setOpen(o => !o)}
        className="hover:bg-slate-50/60 transition-colors cursor-pointer select-none"
      >
        <td className="px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-slate-700 text-sm">{reference}</span>
            {open
              ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
              : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {createdAt ? new Date(createdAt).toLocaleDateString() : ''}
          </p>
        </td>
        <td className="px-5 py-4">
          <p className="font-medium text-slate-800 text-sm">{customerName}</p>
          <p className="text-xs text-slate-400">{customerEmail}</p>
        </td>
        <td className="px-5 py-4 text-sm text-slate-600">
          <div className="flex flex-wrap gap-1">
            {items.map((item: any, i: number) => (
              <span key={i} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium">
                {ITEM_LABELS[item?.itemType] ?? item?.itemType ?? 'Item'}
              </span>
            ))}
          </div>
        </td>
        <td className="px-5 py-4 text-sm text-slate-500">{booking.serviceDate ?? ''}</td>
        <td className="px-5 py-4">
          <p className="font-bold text-slate-800 text-sm">{formatMoney(totalCents)}</p>
          {markupCents > 0 && (
            <p className="text-[10px] text-amber-600">+{formatMoney(markupCents)} markup</p>
          )}
        </td>
        <td className="px-5 py-4">
          <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border', s.cls)}>
            <Icon className="w-3 h-3" />{s.label}
          </span>
        </td>
        <td className="px-5 py-4">
          <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => onDownload(booking.id, booking.reference)}
              className="p-1.5 text-slate-400 hover:text-brand-primary hover:bg-brand-primary/5 rounded-lg transition-colors"
              title="Download Invoice"
            >
              <Download className="w-4 h-4" />
            </button>
            {booking.status === 'PENDING' && (
              <button
                onClick={() => onCancel(booking.id)}
                className="text-xs text-red-400 hover:text-red-600 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </td>
      </tr>

      {/* Expanded detail panel */}
      {open && (
        <tr>
          <td colSpan={7} className="px-0 py-0 bg-slate-50 border-t border-b border-slate-100">
            <div className="px-5 py-5 space-y-4">

              {/* Price breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Subtotal',  value: formatMoney(booking.subtotalCents) },
                  { label: 'VAT (15%)', value: formatMoney(booking.vatCents) },
                  ...(booking.markupCents > 0
                    ? [{ label: `Your Markup (${booking.markupRate}%)`, value: `+${formatMoney(booking.markupCents)}` }]
                    : []),
                  { label: 'Total charged by Ambiance', value: formatMoney(booking.totalCents) },
                ].map(row => (
                  <div key={row.label} className="bg-white rounded-xl border border-slate-200 px-4 py-3">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{row.label}</p>
                    <p className="font-bold text-slate-800 mt-0.5">{row.value}</p>
                  </div>
                ))}
              </div>

              {/* Booking items */}
              {items.map((item: any, idx: number) => {
                const extras = getSelectedExtras(item);
                return (
                  <div key={idx} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                    {/* Item header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                          <Tag className="w-3.5 h-3.5 text-brand-primary" />
                        </div>
                        <span className="font-bold text-slate-700 text-sm">
                          {ITEM_LABELS[item.itemType] ?? item.itemType}
                        </span>
                      </div>
                      <span className="font-bold text-slate-800 text-sm">{formatMoney(item.totalCents)}</span>
                    </div>

                    {/* Booking details grid — uses structured API fields directly */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1.5 text-xs">
                      {item.rentalDays > 0 && (
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <Calendar className="w-3 h-3 text-brand-primary" />
                          {item.rentalDays} day{item.rentalDays > 1 ? 's' : ''} rental
                        </span>
                      )}
                      {item.paxAdults > 0 && (
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <Users className="w-3 h-3 text-brand-primary" />
                          {item.paxAdults} adult{item.paxAdults > 1 ? 's' : ''}
                          {item.paxChildren > 0 ? `, ${item.paxChildren} child${item.paxChildren > 1 ? 'ren' : ''}` : ''}
                          {item.paxInfants > 0 ? `, ${item.paxInfants} infant${item.paxInfants > 1 ? 's' : ''}` : ''}
                        </span>
                      )}
                      {item.pickupLocation && (
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <MapPin className="w-3 h-3 text-green-500" />
                          Pickup: {item.pickupLocation}
                        </span>
                      )}
                      {item.dropoffLocation && (
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <MapPin className="w-3 h-3 text-red-400" />
                          Drop-off: {item.dropoffLocation}
                        </span>
                      )}
                      {item.serviceDate && (
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <Calendar className="w-3 h-3 text-brand-primary" />
                          Service: {item.serviceDate}
                        </span>
                      )}
                      {item.tripType && (
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <Tag className="w-3 h-3 text-brand-primary" />
                          {String(item.tripType).replace(/_/g, ' ')}
                        </span>
                      )}
                      {item.notes && (
                        <span className="flex items-start gap-1.5 text-slate-500 col-span-2">
                          <Briefcase className="w-3 h-3 text-brand-primary mt-0.5 shrink-0" />
                          {item.notes}
                        </span>
                      )}
                    </div>

                    {/* Extra / add-on services */}
                    {extras.length > 0 && (
                      <div className="pt-3 border-t border-slate-100 space-y-1.5">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <Star className="w-3 h-3 text-amber-400" /> Add-on Services
                        </p>
                        {extras.map((e, i) => (
                          <div key={i} className="flex justify-between text-xs">
                            <span className="text-slate-600">{e.name}</span>
                            <span className="font-medium text-slate-700">{formatMoney(e.priceCents)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {booking.cancelReason && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
                  <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span><strong>Cancel reason:</strong> {booking.cancelReason}</span>
                </div>
              )}

              {booking.specialRequests && (
                <div className="text-xs text-slate-500 bg-white border border-slate-100 rounded-xl px-4 py-3">
                  <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Special Requests</span>
                  {booking.specialRequests}
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
const SEARCH_DEBOUNCE_MS = 300;

export default function MyBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');           // debounced
  const [statusFilter, setStatusFilter] = useState('');
  const inFlightRef = useRef<AbortController | null>(null);

  // Debounce the raw input → committed `search` value
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  const loadBookings = useCallback(async (signal?: AbortSignal) => {
    // Cancel any in-flight request before starting a new one.
    if (!signal) {
      inFlightRef.current?.abort();
      const ctrl = new AbortController();
      inFlightRef.current = ctrl;
      signal = ctrl.signal;
    }

    setLoading(true);
    setError('');
    try {
      const params: Record<string, string | number> = { size: 50 };
      if (search)       params.search = search;
      if (statusFilter) params.status = statusFilter;

      const res = await apiClient.get('/bookings', { params, signal });
      // Discard if a newer request superseded this one
      if (signal.aborted) return;
      const { bookings: list, total: tot } = normalise(res.data);
      setBookings(list as Booking[]);
      setTotal(tot);
    } catch (err: any) {
      // Aborted / cancelled requests are not errors to display
      if (axios.isCancel(err) || err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return;
      const msg =
        err?.response?.data?.error?.message ??
        err?.response?.data?.message ??
        err?.message ??
        `Error ${err?.response?.status ?? ''}: Could not load bookings. Please refresh.`;
      setError(msg);
      setBookings([]);
      setTotal(0);
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [search, statusFilter]);

  // Refetch on debounced search/status change. Cleanup aborts in-flight.
  useEffect(() => {
    const ctrl = new AbortController();
    inFlightRef.current = ctrl;
    loadBookings(ctrl.signal);
    return () => ctrl.abort();
  }, [loadBookings]);

  const handleCancel = async (id: string) => {
    const reason = prompt('Reason for cancellation (optional):') ?? '';
    try {
      const updated = await cancelBooking(id, reason);
      setBookings(prev => prev.map(b => b.id === id ? updated : b));
    } catch (e: any) {
      alert(e?.response?.data?.message ?? e?.response?.data?.error?.message ?? 'Could not cancel booking');
    }
  };

  const handleDownloadInvoice = async (id: string, ref: string) => {
    try {
      const res = await apiClient.get(`/bookings/${id}/invoice`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${ref}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Invoice not available yet. Please contact support.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-800">My Bookings</h1>
          <p className="text-slate-500 mt-1">
            {loading ? 'Loading…' : `${total} booking${total !== 1 ? 's' : ''} total`}
          </p>
        </div>
        <button
          onClick={() => loadBookings()}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4 mb-6 text-sm text-red-600">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Could not load bookings</p>
            <p className="mt-0.5 text-red-500">{error}</p>
            <button onClick={() => loadBookings()} className="mt-2 text-xs font-bold underline hover:no-underline">
              Try again
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Filters */}
        <div className="p-5 border-b border-slate-100 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by reference or customer name…"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-primary/20"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white outline-none"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 mx-auto mb-3 text-slate-300 animate-spin" />
            <p className="text-slate-400 text-sm">Loading your bookings…</p>
          </div>
        ) : bookings.length === 0 && !error ? (
          <div className="p-12 text-center text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-semibold text-slate-500">No bookings found</p>
            <p className="text-sm mt-1">
              {statusFilter || search
                ? 'Try clearing your filters to see all bookings.'
                : 'Your bookings will appear here once you place an order.'}
            </p>
          </div>
        ) : bookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-100">
                  <th className="px-5 py-3">Reference</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Services</th>
                  <th className="px-5 py-3">Service Date</th>
                  <th className="px-5 py-3">Total</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(bookings as Booking[]).map((booking: Booking) => (
                  <React.Fragment key={booking.id}>
                    <BookingRow
                      booking={booking}
                      onCancel={handleCancel}
                      onDownload={handleDownloadInvoice}
                    />
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
}
