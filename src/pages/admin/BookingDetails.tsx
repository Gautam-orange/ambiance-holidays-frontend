import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ChevronLeft, User, Mail, Phone, Calendar, Tag, CheckCircle, XCircle,
  Clock, AlertTriangle, Download, MapPin, Users, Briefcase, Star,
} from 'lucide-react';
import { adminGetBooking, adminUpdateBookingStatus, adminCancelBooking, Booking, BookingItem, formatMoney } from '../../api/bookings';
import { cn } from '../../lib/utils';
import apiClient from '../../api/client';

const STATUS_STYLES: Record<string, string> = {
  PENDING:   'bg-yellow-50 text-yellow-700 border-yellow-200',
  CONFIRMED: 'bg-green-50 text-green-700 border-green-200',
  CANCELLED: 'bg-red-50 text-red-600 border-red-200',
};

const ITEM_TYPE_LABELS: Record<string, string> = {
  CAR_RENTAL: 'Car Rental', CAR_TRANSFER: 'Transfer',
  TOUR: 'Tour', DAY_TRIP: 'Day Trip', HOTEL: 'Hotel',
};

// ─── Cancel modal ─────────────────────────────────────────────────────────────
function CancelModal({
  onCancel, onConfirm, loading,
}: { onCancel: () => void; onConfirm: (reason: string, byType: string) => void; loading: boolean }) {
  const [reason, setReason] = useState('');
  const [byType, setByType] = useState('ADMIN');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">Cancel Booking</h3>
          <button onClick={onCancel} className="p-1 hover:bg-slate-100 rounded-lg">
            <XCircle className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Cancelled by</label>
          <div className="flex gap-4">
            {['ADMIN', 'CUSTOMER'].map(t => (
              <label key={t} className="flex items-center gap-2 cursor-pointer text-sm text-slate-600">
                <input type="radio" name="byType" value={t} checked={byType === t}
                  onChange={() => setByType(t)} className="accent-brand-primary" />
                {t.charAt(0) + t.slice(1).toLowerCase()}
              </label>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Cancellation reason</label>
          <textarea rows={3} value={reason} onChange={e => setReason(e.target.value)}
            placeholder="Reason…"
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-primary resize-none" />
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onCancel}
            className="flex-1 border border-slate-200 text-slate-700 py-2.5 rounded-xl font-medium hover:bg-slate-50">
            No
          </button>
          <button onClick={() => onConfirm(reason, byType)} disabled={loading}
            className="flex-1 bg-red-600 text-white py-2.5 rounded-xl font-bold hover:bg-red-700 disabled:opacity-50">
            {loading ? 'Cancelling…' : 'Cancel Booking'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Booking item card ────────────────────────────────────────────────────────
function ItemCard({ item }: { item: BookingItem }) {
  const extras = item.extras ?? [];

  return (
    <div className="p-5 bg-slate-50 rounded-xl space-y-3 border border-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand-primary/10 flex items-center justify-center">
            <Tag className="w-3.5 h-3.5 text-brand-primary" />
          </div>
          <span className="font-bold text-slate-700 text-sm">
            {ITEM_TYPE_LABELS[item.itemType] ?? item.itemType}
          </span>
        </div>
        <span className="font-bold text-slate-800 text-base">{formatMoney(item.totalCents)}</span>
      </div>

      {/* Structured booking details — read from direct response fields */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 text-xs text-slate-500">
        {(item.paxAdults ?? 0) > 0 && (
          <span className="flex items-center gap-1.5">
            <Users className="w-3 h-3 text-brand-primary" />
            {item.paxAdults} adult{item.paxAdults > 1 ? 's' : ''}
            {(item.paxChildren ?? 0) > 0 && `, ${item.paxChildren} child${item.paxChildren! > 1 ? 'ren' : ''}`}
            {(item.paxInfants ?? 0) > 0  && `, ${item.paxInfants} infant${item.paxInfants! > 1 ? 's' : ''}`}
          </span>
        )}
        {(item.rentalDays ?? 0) > 0 && (
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3 text-brand-primary" />
            {item.rentalDays} day{item.rentalDays! > 1 ? 's' : ''} rental
          </span>
        )}
        {item.serviceDate && (
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3 text-slate-400" />
            Service: {item.serviceDate}
          </span>
        )}
        {item.pickupLocation && (
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-green-500" />
            Pickup: {item.pickupLocation}
          </span>
        )}
        {item.dropoffLocation && (
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-red-400" />
            Drop-off: {item.dropoffLocation}
          </span>
        )}
        {item.tripType && (
          <span className="flex items-center gap-1.5">
            <Tag className="w-3 h-3 text-brand-primary" />
            {String(item.tripType).replace(/_/g, ' ')}
          </span>
        )}
        {item.notes && (
          <span className="flex items-start gap-1.5 col-span-2">
            <Briefcase className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" />
            {item.notes}
          </span>
        )}
      </div>

      {/* Add-on / extra services */}
      {extras.length > 0 && (
        <div className="pt-3 border-t border-slate-200 space-y-1.5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-2">
            <Star className="w-3 h-3 text-amber-400" /> Add-on Services
          </p>
          {extras.map((e, i) => (
            <div key={i} className="flex justify-between text-xs">
              <span className="text-slate-600 font-medium">{e.label}</span>
              <span className="text-slate-500">{formatMoney(e.unitPriceCents)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function BookingDetails() {
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    if (!id) return;
    adminGetBooking(id)
      .then(b => setBooking(b))
      .catch(() => setError('Failed to load booking'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStatusChange = async (status: string) => {
    if (!booking) return;
    setActionLoading(true);
    try {
      const updated = await adminUpdateBookingStatus(booking.id, status);
      setBooking(updated);
    } catch { setError('Failed to update status'); }
    finally { setActionLoading(false); }
  };

  const handleCancel = async (reason: string, byType: string) => {
    if (!booking) return;
    setActionLoading(true);
    try {
      const updated = await adminCancelBooking(booking.id, reason, byType);
      setBooking(updated);
      setShowCancelModal(false);
    } catch { setError('Failed to cancel booking'); }
    finally { setActionLoading(false); }
  };

  const handleConvertEnquiry = async () => {
    if (!booking) return;
    setActionLoading(true);
    try {
      await apiClient.post(`/admin/enquiries/${booking.id}/convert`);
      const updated = await adminGetBooking(booking.id);
      setBooking(updated);
    } catch { setError('Failed to convert enquiry'); }
    finally { setActionLoading(false); }
  };

  const downloadInvoice = async () => {
    if (!booking) return;
    try {
      const res = await apiClient.get(`/admin/bookings/${booking.id}/invoice`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${booking.reference}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { setError('Could not download invoice'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading…</div>;
  if (error && !booking) return <div className="p-8 text-red-500">{error || 'Booking not found'}</div>;
  if (!booking) return null;

  return (
    <>
      {showCancelModal && (
        <CancelModal
          onCancel={() => setShowCancelModal(false)}
          onConfirm={handleCancel}
          loading={actionLoading}
        />
      )}

      <div className="space-y-8 max-w-6xl mx-auto pb-12">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Link to="/admin/bookings"
              className="p-2 hover:bg-white rounded-lg transition-all border border-transparent hover:border-slate-200">
              <ChevronLeft className="w-5 h-5 text-slate-500" />
            </Link>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-3xl font-bold text-slate-800">{booking.reference}</h2>
                {booking.isEnquiry && (
                  <span className="px-2.5 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                    Enquiry
                  </span>
                )}
                <span className={cn('px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border',
                  STATUS_STYLES[booking.status] ?? 'bg-slate-100 text-slate-500')}>
                  {booking.status}
                </span>
              </div>
              <p className="text-slate-500 text-sm mt-1">
                Service date: <strong className="text-slate-700">{booking.serviceDate}</strong>
                {booking.createdByName && (
                  <span className="ml-3 text-slate-400">
                    — booked by <strong className="text-slate-600">{booking.createdByName}</strong>
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={downloadInvoice}
              className="flex items-center gap-2 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-medium hover:bg-slate-50 text-sm">
              <Download className="w-4 h-4" /> Invoice
            </button>
            {booking.isEnquiry && booking.status === 'PENDING' && (
              <button onClick={handleConvertEnquiry} disabled={actionLoading}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-green-700 text-sm disabled:opacity-50">
                <CheckCircle className="w-4 h-4" /> Convert to Booking
              </button>
            )}
            {!booking.isEnquiry && booking.status === 'PENDING' && (
              <button onClick={() => handleStatusChange('CONFIRMED')} disabled={actionLoading}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-green-700 text-sm disabled:opacity-50">
                <CheckCircle className="w-4 h-4" /> Confirm
              </button>
            )}
            {booking.status !== 'CANCELLED' && (
              <button onClick={() => setShowCancelModal(true)}
                className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-200 px-4 py-2.5 rounded-xl font-bold hover:bg-red-100 text-sm">
                <XCircle className="w-4 h-4" /> Cancel
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Left / main column ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Cancellation notice */}
            {booking.cancelReason && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-red-400" />
                <div>
                  <p className="font-bold">
                    Cancelled{booking.cancelledByType ? ` by ${booking.cancelledByType}` : ''}
                  </p>
                  <p className="mt-0.5">{booking.cancelReason}</p>
                </div>
              </div>
            )}

            {/* Booking items */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800">
                  Booking Items
                  <span className="ml-2 text-sm font-normal text-slate-400">
                    ({booking.items?.length ?? 0})
                  </span>
                </h3>
              </div>
              <div className="p-6 space-y-4">
                {(booking.items ?? []).length === 0 ? (
                  <p className="text-slate-400 text-sm">No items found</p>
                ) : (
                  (booking.items ?? []).map(item => (
                    <React.Fragment key={item.id}>
                      <ItemCard item={item} />
                    </React.Fragment>
                  ))
                )}
              </div>
            </div>

            {/* Special requests */}
            {booking.specialRequests && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="font-bold text-slate-800 mb-2">Special Requests</h3>
                <p className="text-sm text-slate-600">{booking.specialRequests}</p>
              </div>
            )}
          </div>

          {/* ── Right sidebar ── */}
          <div className="space-y-6">

            {/* Customer */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <h3 className="font-bold text-slate-800">Customer</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <User className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-semibold">{booking.customerName}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{booking.customerEmail}</span>
                </div>
                {booking.customerPhone && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{booking.customerPhone}</span>
                  </div>
                )}
              </div>

              {/* Agent */}
              {booking.agentName && (
                <div className="pt-4 border-t border-slate-100 space-y-1">
                  <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Booked via Agent</p>
                  <p className="text-sm font-semibold text-slate-700">{booking.agentName}</p>
                  {booking.createdByName && (
                    <p className="text-xs text-slate-400">by {booking.createdByName}</p>
                  )}
                </div>
              )}
            </div>

            {/* Pricing breakdown */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
              <h3 className="font-bold text-slate-800">Pricing Breakdown</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>{formatMoney(booking.subtotalCents)}</span>
                </div>
                {(booking.markupCents ?? 0) > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Agent Markup ({booking.markupRate}%)</span>
                    <span>+{formatMoney(booking.markupCents)}</span>
                  </div>
                )}
                {(booking.commissionCents ?? 0) > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Commission ({booking.commissionRate}%)</span>
                    <span>{formatMoney(booking.commissionCents)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>VAT ({booking.vatRate}%)</span>
                  <span>+{formatMoney(booking.vatCents)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-100 text-base">
                  <span>Total</span>
                  <span>{formatMoney(booking.totalCents)}</span>
                </div>
              </div>
              {(booking.cancellationFeeCents ?? 0) > 0 && (
                <div className="pt-3 border-t border-slate-100 flex justify-between text-red-600 font-medium text-sm">
                  <span>Cancellation Fee</span>
                  <span>{formatMoney(booking.cancellationFeeCents)}</span>
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
              <h3 className="font-bold text-slate-800">Timeline</h3>
              <div className="space-y-2 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Created {new Date(booking.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Service date: {booking.serviceDate}</span>
                </div>
                {booking.cancelledAt && (
                  <div className="flex items-center gap-2 text-red-500">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Cancelled {new Date(booking.cancelledAt).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
