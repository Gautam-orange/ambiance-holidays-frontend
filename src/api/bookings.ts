import api from './client';

export interface CartItem {
  id: string;
  itemType: string;
  refId: string;
  title: string | null;
  imageUrl: string | null;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  options: Record<string, unknown> | null;
  expiresAt: string;
}

export interface CartSummary {
  items: CartItem[];
  subtotalCents: number;
  vatCents: number;
  totalCents: number;
  itemCount: number;
}

export interface BookingItem {
  id: string;
  itemType: string;
  refId: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
  serviceDate: string;
  pickupLocation: string | null;
  dropoffLocation: string | null;
  paxAdults: number;
  paxChildren: number;
  paxInfants: number;
  rentalDays: number | null;
  tripType: string | null;
  notes: string | null;
  extras: { id: string; label: string; quantity: number; unitPriceCents: number; totalCents: number }[];
}

export interface Booking {
  id: string;
  reference: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  agentName: string | null;
  agentId: string | null;
  createdByName: string | null;
  isEnquiry: boolean;
  cancelledByType: string | null;
  serviceDate: string;
  subtotalCents: number;
  markupCents: number;
  commissionCents: number;
  vatCents: number;
  totalCents: number;
  vatRate: number;
  markupRate: number;
  commissionRate: number;
  specialRequests: string | null;
  cancelReason: string | null;
  cancellationFeeCents: number;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: BookingItem[];
}

// Cart
// All cart mutations emit a window 'cart-updated' event with the latest
// summary. CartContext listens to this so the badge in the agent header
// (and anywhere else) stays in sync without an extra round-trip.
const emitCartUpdated = (summary: CartSummary | null) => {
  try { window.dispatchEvent(new CustomEvent('cart-updated', { detail: summary })); } catch { /* ignore */ }
};

export const getCart = () =>
  api.get('/cart').then(r => {
    const summary = r.data.data as CartSummary;
    emitCartUpdated(summary);
    return summary;
  });

export const addToCart = (payload: {
  itemType: string;
  refId: string;
  quantity: number;
  options?: Record<string, unknown>;
}) => api.post('/cart/items', payload).then(r => {
  const summary = r.data.data as CartSummary;
  emitCartUpdated(summary);
  return summary;
});

export const removeFromCart = (itemId: string) =>
  api.delete(`/cart/items/${itemId}`).then(r => {
    const summary = r.data.data as CartSummary;
    emitCartUpdated(summary);
    return summary;
  });

export const clearCart = () =>
  api.delete('/cart').then(r => {
    emitCartUpdated({ items: [], subtotalCents: 0, vatCents: 0, totalCents: 0, itemCount: 0 });
    return r.data;
  });

// Checkout (legacy: creates a booking immediately, no payment step)
export const checkout = (data: {
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone?: string;
  serviceDate: string;
  specialRequests?: string;
}) => api.post('/bookings', data).then(r => r.data.data as Booking);

// Peach Payments V2 — initiate a checkout: creates a PENDING booking and a
// Peach checkout, returns the redirectUrl the frontend should send the
// browser to. After payment Peach redirects back to /payment/return?id=...
export interface PeachInitiateResponse {
  bookingId: string;
  bookingReference: string;
  checkoutId: string;
  redirectUrl: string;
}
export const initiatePeachCheckout = (
  data: {
    customerFirstName: string;
    customerLastName: string;
    customerEmail: string;
    customerPhone?: string;
    serviceDate: string;
    specialRequests?: string;
  },
  currency?: string,
) =>
  api
    .post('/payments/peach/initiate', data, { params: currency ? { currency } : undefined })
    .then(r => r.data.data as PeachInitiateResponse);

// Peach Payments — read the result of a checkout after the user is redirected back.
export interface PeachStatusResponse {
  success: boolean;
  bookingId: string;
  bookingReference: string;
  bookingStatus: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
  resultCode: string | null;
  resultDescription: string | null;
}
/** Accepts either a Peach checkoutId or our booking reference (Peach's V2
 *  redirect carries merchantTransactionId, which we use as the booking ref).  */
export const checkPeachStatus = (key: string) =>
  api
    .get('/payments/peach/status', { params: { ref: key } })
    .then(r => r.data.data as PeachStatusResponse);

// Bookings
export const listBookings = (params?: { search?: string; status?: string; page?: number; size?: number }) =>
  api.get('/bookings', { params }).then(r => r.data);

export const getBooking = (id: string) =>
  api.get(`/bookings/${id}`).then(r => r.data.data as Booking);

export const cancelBooking = (id: string, reason?: string) =>
  api.post(`/bookings/${id}/cancel`, null, { params: { reason } }).then(r => r.data.data as Booking);

// Admin bookings
export const adminListBookings = (params?: {
  search?: string; status?: string; agentId?: string;
  dateFrom?: string; dateTo?: string;
  enquiry?: boolean;
  page?: number; size?: number;
}) => api.get('/admin/bookings', { params }).then(r => r.data);

export const adminGetBooking = (id: string) =>
  api.get(`/admin/bookings/${id}`).then(r => r.data.data as Booking);

export const adminUpdateBookingStatus = (id: string, status: string) =>
  api.patch(`/admin/bookings/${id}/status`, null, { params: { status } }).then(r => r.data.data as Booking);

export const adminCancelBooking = (id: string, reason?: string, cancelledByType?: string) =>
  api.post(`/admin/bookings/${id}/cancel`, { reason, cancelledByType }).then(r => r.data.data as Booking);

// Helpers
export const formatMoney = (cents: number) =>
  `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
