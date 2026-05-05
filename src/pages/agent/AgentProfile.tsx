import React, { useEffect, useState } from 'react';
import { Building2, Mail, Phone, MapPin, Globe } from 'lucide-react';

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
    country?: string;
    city?: string;
    address?: string;
    businessType?: string;
    phone?: string;
  };
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-50 text-green-700',
  PENDING: 'bg-amber-50 text-amber-700',
  SUSPENDED: 'bg-red-50 text-red-700',
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
  const businessTypeLabel = agent?.businessType ? agent.businessType.replaceAll('_', ' ') : null;

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
                <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${STATUS_COLORS[agent.status] ?? 'bg-slate-100 text-slate-600'}`}>
                  {agent.status}
                </span>
                {agent.phone && (
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <Phone className="w-3.5 h-3.5" /> {agent.phone}
                  </span>
                )}
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
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <dt className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Company</dt>
              <dd className="font-medium text-slate-800">{agent.companyName}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Agent ID</dt>
              <dd className="font-mono text-sm text-slate-600 break-all">{agent.id}</dd>
            </div>
            {businessTypeLabel && (
              <div>
                <dt className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Business Type</dt>
                <dd className="font-medium text-slate-800">{businessTypeLabel}</dd>
              </div>
            )}
            {agent.phone && (
              <div>
                <dt className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />Mobile</dt>
                <dd className="font-medium text-slate-800">{agent.phone}</dd>
              </div>
            )}
            {(agent.country || agent.city) && (
              <div>
                <dt className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" />Country / City</dt>
                <dd className="font-medium text-slate-800">{agent.country}{agent.city ? `, ${agent.city}` : ''}</dd>
              </div>
            )}
            {agent.address && (
              <div className="md:col-span-2">
                <dt className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />Address</dt>
                <dd className="font-medium text-slate-800">{agent.address}</dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}
