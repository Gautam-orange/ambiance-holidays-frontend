import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getCart, type CartSummary } from '../api/bookings';

interface CartContextValue {
  /** Number of items currently in the cart (updated in near-real-time). */
  count: number;
  /** Total cents in the cart, useful for header summaries. */
  totalCents: number;
  /** Force a refetch from the backend. */
  refresh: () => Promise<void>;
  /** Apply a cart summary returned by a mutation — bypasses the network round-trip. */
  applyCart: (summary: CartSummary | null) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [count, setCount] = useState(0);
  const [totalCents, setTotalCents] = useState(0);
  const inFlightRef = useRef<AbortController | null>(null);
  const location = useLocation();

  const applyCart = useCallback((summary: CartSummary | null) => {
    setCount(summary?.itemCount ?? 0);
    setTotalCents(summary?.totalCents ?? 0);
  }, []);

  const refresh = useCallback(async () => {
    inFlightRef.current?.abort();
    const ctrl = new AbortController();
    inFlightRef.current = ctrl;
    try {
      const summary = await getCart();
      if (!ctrl.signal.aborted) applyCart(summary);
    } catch {
      // Cart fetch failures are non-fatal — leave the previous count in place
      // (better than flashing to 0 on a transient network blip).
    }
  }, [applyCart]);

  // Initial load
  useEffect(() => { refresh(); }, [refresh]);

  // Refetch whenever the route changes — covers cart mutations from anywhere
  // in the app even if they didn't call applyCart explicitly.
  useEffect(() => { refresh(); }, [location.pathname, refresh]);

  // Refetch when the user comes back to the tab — covers another tab
  // adding/removing items, or the cart expiring server-side.
  useEffect(() => {
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refresh]);

  // Cross-tab login/logout — when accessToken changes in another tab,
  // the session-key on the server flips between user and guest, so refetch.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'accessToken' || e.key === 'cartId') refresh();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [refresh]);

  // Same-tab updates from cart API helpers — apply directly without a fetch.
  useEffect(() => {
    const onCartUpdated = (e: Event) => {
      const summary = (e as CustomEvent<CartSummary | null>).detail;
      applyCart(summary);
    };
    window.addEventListener('cart-updated', onCartUpdated);
    return () => window.removeEventListener('cart-updated', onCartUpdated);
  }, [applyCart]);

  return (
    <CartContext.Provider value={{ count, totalCents, refresh, applyCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
