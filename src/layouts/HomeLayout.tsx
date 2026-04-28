import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import { Facebook, Linkedin, Instagram, Phone, Mail, LogOut, User, ChevronDown, Twitter, ShoppingCart } from 'lucide-react';
import apiClient from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

export default function HomeLayout() {
  const { user, isAuthenticated, logout } = useAuth();
  const { count: cartCount } = useCart();
  const navigate = useNavigate();
  const [newsletter, setNewsletter] = useState('');
  const [newsletterDone, setNewsletterDone] = useState(false);
  const [agentOpen, setAgentOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const isAgent = user?.role === 'B2B_AGENT';

  const handleLogout = async () => {
    setAgentOpen(false);
    await logout();
    navigate('/');
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setAgentOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletter) return;
    try {
      await apiClient.post('/public/newsletter', { email: newsletter });
      setNewsletterDone(true);
    } catch {/* ignore */}
  };

  // Public nav links (unauthenticated)
  const publicNavLinks = [
    { label: 'Car Rental', path: '/car-rental' },
    { label: 'Transfers', path: '/transfers' },
    { label: 'Tours', path: '/tours' },
    { label: 'Day Trips', path: '/day-trips' },
  ];

  // Agent nav links (authenticated)
  const agentNavLinks = [
    { label: 'Home', path: '/' },
    { label: 'Tours/Activities', path: '/tours' },
    { label: 'Local Experiences', path: '/day-trips' },
    { label: 'Car Rental', path: '/car-rental' },
    { label: 'Transfers', path: '/transfers' },
  ];

  const navLinks = isAuthenticated ? agentNavLinks : publicNavLinks;

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Top Info Bar */}
      <div className="bg-brand-900 text-white py-2 px-8 flex justify-between items-center text-xs">
        <p className="font-medium tracking-wide">Ambiance Holidays</p>
        <div className="flex items-center gap-4">
          <Facebook className="w-3.5 h-3.5 cursor-pointer hover:text-brand-primary" />
          <Twitter className="w-3.5 h-3.5 cursor-pointer hover:text-brand-primary" />
          <Linkedin className="w-3.5 h-3.5 cursor-pointer hover:text-brand-primary" />
          <Instagram className="w-3.5 h-3.5 cursor-pointer hover:text-brand-primary" />
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="bg-white border-b border-slate-100 px-8 py-3 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
          <Link to="/" className="shrink-0">
            <img src="/images/logo.png" alt="Ambiance Holidays" className="h-11 w-auto" />
          </Link>

          <div className="hidden lg:flex items-center gap-6 flex-1 justify-center">
            {navLinks.map((link) => (
              <NavLink
                key={link.path + link.label}
                to={link.path}
                end={link.path === '/'}
                className={({ isActive }) =>
                  `text-sm font-semibold tracking-tight whitespace-nowrap transition-colors ${
                    isActive ? 'text-brand-primary' : 'text-slate-600 hover:text-brand-primary'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Cart icon — visible to everyone (guests + logged-in users) */}
            <Link
              to="/cart"
              aria-label={cartCount > 0 ? `Cart (${cartCount} item${cartCount === 1 ? '' : 's'})` : 'Cart (empty)'}
              className="relative inline-flex items-center justify-center w-10 h-10 rounded-full text-slate-600 hover:text-brand-primary hover:bg-brand-primary/5 transition-colors"
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
            {isAuthenticated ? (
              /* Agent dropdown */
              <div className="relative" ref={dropRef}>
                <button
                  onClick={() => setAgentOpen(o => !o)}
                  className="flex items-center gap-2 border border-slate-200 rounded-full px-4 py-2 text-sm font-bold text-slate-700 hover:border-brand-primary hover:text-brand-primary transition-colors"
                >
                  <User className="w-4 h-4" />
                  {user?.firstName ?? 'Agent'}
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${agentOpen ? 'rotate-180' : ''}`} />
                </button>
                {agentOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl border border-slate-100 shadow-xl py-2 z-50">
                    <Link
                      to={isAgent ? '/agent/bookings' : '/admin'}
                      onClick={() => setAgentOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-primary transition-colors"
                    >
                      <User className="w-4 h-4" /> My Bookings
                    </Link>
                    <Link
                      to="/agent/profile"
                      onClick={() => setAgentOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-primary transition-colors"
                    >
                      <User className="w-4 h-4" /> Profile
                    </Link>
                    <div className="border-t border-slate-100 my-1" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 w-full transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <NavLink
                to="/auth/login"
                className="flex items-center gap-2 bg-brand-primary text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-brand-secondary transition-all shadow-md shadow-brand-primary/20"
              >
                B2B Login →
              </NavLink>
            )}
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-brand-900 text-white pt-16 pb-8 border-t-4 border-brand-primary">
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <img src="/images/logo.png" alt="Ambiance Holidays" className="h-10 w-auto brightness-0 invert" />
            <p className="text-slate-400 text-sm leading-relaxed">
              Tailored escapes. Timeless memories.<br />
              Experience the soul of the Indian Ocean with Ambiance Holidays.
            </p>
            <div className="flex gap-4">
              <Facebook className="w-5 h-5 text-slate-400 hover:text-brand-primary transition-colors cursor-pointer" />
              <Twitter className="w-5 h-5 text-slate-400 hover:text-brand-primary transition-colors cursor-pointer" />
              <Linkedin className="w-5 h-5 text-slate-400 hover:text-brand-primary transition-colors cursor-pointer" />
              <Instagram className="w-5 h-5 text-slate-400 hover:text-brand-primary transition-colors cursor-pointer" />
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="font-display font-bold text-lg">Quick Links</h3>
            <ul className="space-y-3 text-slate-400 text-sm">
              <li><Link to="/" className="hover:text-brand-primary transition-colors">Home</Link></li>
              <li><Link to="/about" className="hover:text-brand-primary transition-colors">About us</Link></li>
              <li><Link to="/tours" className="hover:text-brand-primary transition-colors">Company Profile</Link></li>
              <li><Link to="/tours" className="hover:text-brand-primary transition-colors">Blogs & News</Link></li>
              <li><Link to="/terms" className="hover:text-brand-primary transition-colors">Term & Conditions</Link></li>
            </ul>
          </div>

          <div className="space-y-6">
            <h3 className="font-display font-bold text-lg">Get In Touch</h3>
            <div className="space-y-4 text-slate-400 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-brand-primary shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p>+230 5285 0500</p>
                  <p>+230 4608423</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-brand-primary shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <p>info@ambianceholidays.com</p>
                  <p>reservation@ambianceholidays.com</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-brand-primary shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <p>Draper Avenue, Quatre Bornes Mauritius</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="font-display font-bold text-lg">Newsletter</h3>
            <p className="text-slate-400 text-sm">Get the latest travel news and offers.</p>
            {newsletterDone ? (
              <p className="text-green-400 text-sm font-medium">✓ Subscribed! Thank you.</p>
            ) : (
              <form onSubmit={handleNewsletter} className="space-y-3">
                <input
                  type="email"
                  value={newsletter}
                  onChange={e => setNewsletter(e.target.value)}
                  placeholder="Enter Email"
                  className="bg-white/10 border-none rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-primary w-full text-white placeholder:text-slate-400"
                />
                <button type="submit" className="w-full bg-brand-primary text-white px-4 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2">
                  Subscribe Now →
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-8 pt-8 border-t border-white/5 text-center text-xs text-slate-500 font-medium">
          <p>All Copyrights Reserved. © 2025. Ambiance Holidays</p>
        </div>
      </footer>
    </div>
  );
}
