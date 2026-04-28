import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Car, Palmtree, Users, Calendar, DollarSign, BookOpen, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { getDashboardStats } from '../../api/agents';
import { formatMoney } from '../../api/bookings';

interface DashboardData {
  bookings: { total: number; pending: number; confirmed: number; cancelled: number };
  revenue: { total: number; thisMonth: number };
  agents: { total: number; pending: number; active: number };
  assets: { activeCars: number; activeTours: number };
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(setData)
      .catch(console.error)
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

  const d = data!;

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
      title: 'Car Fleet',
      link: '/admin/cars',
      icon: Car,
      metrics: [
        { label: 'Active Cars', value: d.assets.activeCars },
      ],
    },
    {
      title: 'Activities',
      link: '/admin/activities',
      icon: Palmtree,
      metrics: [
        { label: 'Active Tours', value: d.assets.activeTours },
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
          <h3 className="font-display font-bold text-slate-800 mb-4">Revenue</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">This Month</p>
              <p className="text-2xl font-display font-bold text-brand-primary">{formatMoney(d.revenue.thisMonth)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">All Time</p>
              <p className="text-xl font-display font-bold text-slate-700">{formatMoney(d.revenue.total)}</p>
            </div>
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
