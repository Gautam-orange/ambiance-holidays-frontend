import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, User, LogOut, ShoppingCart } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

const NAV = [
  { label: 'My Bookings', to: '/agent/bookings', icon: BookOpen },
  { label: 'Profile', to: '/agent/profile', icon: User },
];

// Page title shown in the top header — derived from current route.
function pageTitleFor(pathname: string): string {
  if (pathname.startsWith('/agent/bookings')) return 'My Bookings';
  if (pathname.startsWith('/agent/profile'))  return 'Profile';
  if (pathname.startsWith('/cart'))           return 'Cart';
  if (pathname.startsWith('/checkout'))       return 'Checkout';
  return 'Agent Portal';
}

export default function AgentLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { count: cartCount } = useCart();

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
  };

  // ProtectedRoute should guarantee `user` is non-null, but guard defensively
  // so the sidebar never throws on a transient race (e.g. user manually clears
  // localStorage while on the page).
  const firstName = user?.firstName ?? '';
  const lastName  = user?.lastName  ?? '';
  const initials  = ((firstName[0] ?? '') + (lastName[0] ?? '')).toUpperCase() || '?';
  const tier      = user?.agent?.tier ?? 'Agent';

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-100">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-primary flex items-center justify-center">
              <span className="text-white font-bold text-xs">AH</span>
            </div>
            <span className="font-display font-bold text-slate-800">Agent Portal</span>
          </Link>
        </div>

        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-brand-primary/10 flex items-center justify-center">
              <span className="text-brand-primary font-bold text-sm">{initials}</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">
                {firstName || lastName ? `${firstName} ${lastName}`.trim() : 'Agent'}
              </p>
              <p className="text-xs text-slate-400 truncate">{tier}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <Link
            to="/cart"
            aria-label={cartCount > 0 ? `Cart (${cartCount} item${cartCount === 1 ? '' : 's'})` : 'Cart (empty)'}
            className={cn(
              'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors',
              pathname === '/cart'
                ? 'bg-brand-primary/10 text-brand-primary'
                : 'text-slate-600 hover:bg-slate-50'
            )}
          >
            <span className="relative">
              <ShoppingCart className="w-4 h-4" />
              {cartCount > 0 && (
                <span
                  className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-1 rounded-full bg-brand-primary text-white text-[10px] font-bold leading-[16px] text-center"
                  aria-hidden="true"
                >
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </span>
            Cart
          </Link>
          {NAV.map(item => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors',
                pathname.startsWith(item.to)
                  ? 'bg-brand-primary/10 text-brand-primary'
                  : 'text-slate-600 hover:bg-slate-50'
              )}
            >
              <item.icon className="w-4 h-4" /> {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main column: top header + scrollable content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header */}
        <header className="bg-white border-b border-slate-200 px-8 h-16 flex items-center justify-between sticky top-0 z-30">
          <h1 className="text-base font-display font-bold text-slate-700 truncate">
            {pageTitleFor(pathname)}
          </h1>
          <Link
            to="/cart"
            aria-label={cartCount > 0 ? `Cart (${cartCount} item${cartCount === 1 ? '' : 's'})` : 'Cart (empty)'}
            className="relative inline-flex items-center justify-center w-10 h-10 rounded-full text-slate-500 hover:text-brand-primary hover:bg-brand-primary/5 transition-colors"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-brand-primary text-white text-[10px] font-bold leading-[18px] text-center ring-2 ring-white"
                aria-hidden="true"
              >
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
