import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Car, Palmtree, Users, Calendar, DollarSign, BookOpen, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { getDashboardStats } from '../../api/agents';
import { formatMoney } from '../../api/bookings';

interface ModuleStats {
  currentBookings: number;
  upcomingBookings: number;
  revenueTotal: number;
  revenueThisMonth: number;
}

interface DashboardData {
  bookings: { total: number; pending: number; confirmed: number; cancelled: number };
  revenue: { total: number; thisMonth: number };
  agents: { total: number; pending: number; active: number };
  modules?: {
    carRental: ModuleStats;
    carTransfer: ModuleStats;
    activities: ModuleStats;
    dayTour: ModuleStats;
  };
  assets: {
    activeCars: number;
    inactiveCars?: number;
    activeTours: number;
    inactiveTours?: number;
    activeDayTrips: number;
    inactiveDayTrips?: number;
  };
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDashboardStats()
      .then(d => {
        // Defend against non-JSON responses (backend down, HTML proxy fallback,
        // empty 200 OK) so the page renders an inline error instead of throwing
        // and white-screening the whole admin tree.
        if (!d || typeof d !== 'object' || !d.bookings || !d.revenue || !d.assets) {
          setError('Dashboard data unavailable. Please check that the backend is running.');
          return;
        }
        setData(d);
      })
      .catch(e => {
        setError(e?.response?.data?.error?.message ?? e?.message ?? 'Failed to load dashboard');
      })
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toLocaleDateString('en-MU', { year: 'numeric', month: 'long', day: 'numeric' });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        Loading dashboard…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <h2 className="text-3xl font-display font-bold text-slate-800">Dashboard</h2>
        <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-800">
          {error ?? 'Dashboard data unavailable.'}
        </div>
      </div>
    );
  }

  const d = data;

  // Per-module stats — backend `modules` block was added in V15-era backend.
  // Falls back to zero so older backends still render a clean dashboard.
  const m = d.modules ?? {
    carRental:   { currentBookings: 0, upcomingBookings: 0, revenueTotal: 0, revenueThisMonth: 0 },
    carTransfer: { currentBookings: 0, upcomingBookings: 0, revenueTotal: 0, revenueThisMonth: 0 },
    activities:  { currentBookings: 0, upcomingBookings: 0, revenueTotal: 0, revenueThisMonth: 0 },
    dayTour:     { currentBookings: 0, upcomingBookings: 0, revenueTotal: 0, revenueThisMonth: 0 },
  };

  const statCards = [
    {
      title: 'Bookings',
      link: '/admin/bookings',
      icon: BookOpen,
      metrics: [
        { label: 'Total Bookings', value: d.bookings.total },
        { label: 'Pending', value: d.bookings.pending, highlight: d.bookings.pending > 0 },
      ],
    },
    {
      title: 'Revenue (This Month)',
      link: '#',
      icon: DollarSign,
      metrics: [
        { label: 'This Month', value: formatMoney(d.revenue.thisMonth) },
        { label: 'All Time', value: formatMoney(d.revenue.total) },
      ],
    },
    {
      title: 'Car Rental',
      link: '/admin/cars',
      icon: Car,
      metrics: [
        { label: 'Current Bookings', value: m.carRental.currentBookings },
        { label: 'Upcoming Scheduled', value: m.carRental.upcomingBookings },
      ],
    },
    {
      title: 'Car Transfer',
      link: '/admin/cars',
      icon: Car,
      metrics: [
        { label: 'Current Bookings', value: m.carTransfer.currentBookings },
        { label: 'Upcoming Scheduled', value: m.carTransfer.upcomingBookings },
      ],
    },
    {
      title: 'Activities',
      link: '/admin/activities',
      icon: Palmtree,
      metrics: [
        { label: 'Current Bookings', value: m.activities.currentBookings },
        { label: 'Upcoming Scheduled', value: m.activities.upcomingBookings },
      ],
    },
    {
      title: 'Day Tour',
      link: '/admin/day-trips',
      icon: Palmtree,
      metrics: [
        { label: 'Current Bookings', value: m.dayTour.currentBookings },
        { label: 'Upcoming Scheduled', value: m.dayTour.upcomingBookings },
      ],
    },
    {
      title: 'Agents',
      link: '/admin/agents',
      icon: Users,
      metrics: [
        { label: 'Total Partners', value: d.agents.total },
        { label: 'Pending Approvals', value: d.agents.pending, highlight: d.agents.pending > 0 },
      ],
    },
  ];

  const moduleRevenue = [
    { label: 'Car Rental',   stats: m.carRental },
    { label: 'Car Transfer', stats: m.carTransfer },
    { label: 'Activities',   stats: m.activities },
    { label: 'Day Tour',     stats: m.dayTour },
  ];

  const moduleAssets = [
    { label: 'Cars',              active: d.assets.activeCars,     inactive: d.assets.inactiveCars     ?? 0 },
    { label: 'Activities',        active: d.assets.activeTours,    inactive: d.assets.inactiveTours    ?? 0 },
    { label: 'Local Experiences', active: d.assets.activeDayTrips, inactive: d.assets.inactiveDayTrips ?? 0 },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold text-slate-800">Dashboard</h2>
          <p className="text-slate-500 mt-1">Activities and performance overview</p>
        </div>
        <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
          <Calendar className="w-4 h-4" />
          {today}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {statCards.map((card, idx) => (
          <Link to={card.link} key={card.title}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="p-6 rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative group h-full transition-all hover:border-brand-primary bg-white"
            >
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <card.icon className="w-24 h-24 text-brand-primary" />
              </div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center">
                  <card.icon className="w-5 h-5 text-brand-primary" />
                </div>
                <h3 className="font-display font-bold text-slate-700">{card.title}</h3>
              </div>
              <div className="space-y-4">
                {card.metrics.map(m => (
                  <div key={m.label}>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">{m.label}</p>
                    <p className={cn('text-3xl font-display font-bold',
                      (m as any).highlight ? 'text-amber-500' : 'text-brand-primary')}>
                      {m.value}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          </Link>
        ))}
      </div>

      {/* Revenue by module — adds the per-module breakdown the dashboard
          previously lumped into a single "This Month / All Time" card. */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-slate-800">Revenue by Module</h3>
          <span className="text-xs text-slate-400">This Month · All Time</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {moduleRevenue.map(row => (
            <div key={row.label} className="rounded-xl border border-slate-100 p-4 bg-slate-50/40">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{row.label}</p>
              <p className="mt-2 text-xl font-display font-bold text-brand-primary">{formatMoney(row.stats.revenueThisMonth)}</p>
              <p className="text-xs text-slate-400 mt-0.5">All-time {formatMoney(row.stats.revenueTotal)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Assets — Active vs Inactive count per inventory module. */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-display font-bold text-slate-800 mb-4">Assets</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {moduleAssets.map(row => (
            <div key={row.label} className="rounded-xl border border-slate-100 p-4 bg-slate-50/40">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{row.label}</p>
              <div className="flex items-end justify-between mt-2">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">Active</p>
                  <p className="text-2xl font-display font-bold text-green-600">{row.active}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">Inactive</p>
                  <p className="text-2xl font-display font-bold text-slate-400">{row.inactive}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-display font-bold text-slate-800 mb-4">Booking Summary</h3>
          <div className="space-y-3">
            {[
              { label: 'Pending', value: d.bookings.pending, color: 'bg-amber-400' },
              { label: 'Confirmed', value: d.bookings.confirmed, color: 'bg-green-400' },
              { label: 'Cancelled', value: d.bookings.cancelled, color: 'bg-red-400' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <div className={cn('w-2.5 h-2.5 rounded-full', item.color)} />
                <span className="text-sm text-slate-600 flex-1">{item.label}</span>
                <span className="font-mono font-bold text-slate-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-display font-bold text-slate-800 mb-4">Quick Links</h3>
          <div className="space-y-2">
            {[
              { label: 'Manage Bookings', to: '/admin/bookings' },
              { label: 'Car Fleet', to: '/admin/cars' },
              { label: 'Tours & Activities', to: '/admin/activities' },
              { label: 'Agent Approvals', to: '/admin/agents' },
            ].map(link => (
              <Link
                key={link.to}
                to={link.to}
                className="flex items-center gap-2 text-sm text-brand-primary hover:underline"
              >
                → {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
