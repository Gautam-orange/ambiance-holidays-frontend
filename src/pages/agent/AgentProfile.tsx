import React, { useEffect, useState } from 'react';
import { Building2, Mail, Phone, MapPin, Award, BarChart3, CreditCard } from 'lucide-react';
import { cn } from '../../lib/utils';

interface UserInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  agent?: {
    id: string;
    companyName: string;
    tier: string;
    status: string;
  };
}

const TIER_COLORS: Record<string, string> = {
  PLATINUM: 'bg-indigo-100 text-indigo-700',
  GOLD: 'bg-amber-100 text-amber-700',
  SILVER: 'bg-slate-100 text-slate-600',
  BRONZE: 'bg-orange-100 text-orange-700',
};

export default function AgentProfile() {
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      if (raw) setUser(JSON.parse(raw));
    } catch {/* ignore */}
  }, []);

  if (!user) return <div className="p-12 text-center text-slate-400">Loading profile…</div>;

  const agent = user.agent;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      <h1 className="text-3xl font-display font-bold text-slate-800">My Profile</h1>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <div className="flex items-start gap-6">
          <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-display font-bold text-brand-primary">
              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
            </span>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-display font-bold text-slate-800">{user.firstName} {user.lastName}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-sm text-slate-500">{user.email}</span>
            </div>
            {agent && (
              <div className="flex items-center gap-3 mt-3">
                <span className={cn('px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider',
                  TIER_COLORS[agent.tier] ?? 'bg-slate-100 text-slate-600')}>
                  {agent.tier}
                </span>
                <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full uppercase">
                  {agent.status}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {agent && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <h3 className="font-display font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-brand-primary" />
            Company Information
          </h3>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <dt className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Company</dt>
              <dd className="font-medium text-slate-800">{agent.companyName}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Agent ID</dt>
              <dd className="font-mono text-sm text-slate-600">{agent.id.slice(0, 8)}…</dd>
            </div>
          </dl>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <h3 className="font-display font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-brand-primary" />
          Tier Benefits
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          {[
            { icon: BarChart3, label: 'Commission on every booking' },
            { icon: CreditCard, label: 'Credit limit for bookings' },
            { icon: Award, label: 'Priority customer support' },
            { icon: Building2, label: 'Dedicated account manager (Gold+)' },
          ].map(b => (
            <div key={b.label} className="flex items-center gap-2 text-slate-600">
              <b.icon className="w-4 h-4 text-brand-primary flex-shrink-0" />
              {b.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
