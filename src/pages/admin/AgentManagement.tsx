import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Check, X, Shield, Users, Globe, RefreshCw, Percent, ExternalLink, RotateCcw, Eye, Download } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';
import { listAgents, approveAgent, suspendAgent, rejectAgent, reactivateAgent, updateAgent, getDashboardStats, type Agent } from '../../api/agents';

const TIER_COLORS: Record<string, string> = {
  PLATINUM: 'bg-indigo-50 text-indigo-600',
  GOLD: 'bg-amber-50 text-amber-600',
  SILVER: 'bg-slate-100 text-slate-600',
  BRONZE: 'bg-orange-50 text-orange-600',
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'text-green-600',
  PENDING: 'text-amber-600',
  SUSPENDED: 'text-red-600',
};

type RejectModal = { agentId: string; companyName: string } | null;
type CommissionModal = { agent: Agent } | null;

export default function AgentManagement() {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [stats, setStats] = useState({ total: 0, pending: 0, active: 0, suspended: 0 });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<RejectModal>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [commissionModal, setCommissionModal] = useState<CommissionModal>(null);
  const [commissionValue, setCommissionValue] = useState('');

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listAgents({ search, status: statusFilter || undefined, size: 50 });
      setAgents(res.data);
      setTotal(res.meta?.total ?? res.data.length);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const s = await getDashboardStats();
      setStats({
        total: s.agents.total,
        pending: s.agents.pending,
        active: s.agents.active,
        suspended: 0,
      });
    } catch {/* ignore */}
  }, []);

  useEffect(() => {
    fetchAgents();
    fetchStats();
  }, [fetchAgents, fetchStats]);

  const handleApprove = async (id: string) => {
    setActionLoading(id + '_approve');
    try {
      const updated = await approveAgent(id);
      setAgents(prev => prev.map(a => a.id === id ? updated : a));
      fetchStats();
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspend = async (id: string) => {
    if (!confirm('Suspend this agent?')) return;
    setActionLoading(id + '_suspend');
    try {
      const updated = await suspendAgent(id);
      setAgents(prev => prev.map(a => a.id === id ? updated : a));
      fetchStats();
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setActionLoading(rejectModal.agentId + '_reject');
    try {
      const updated = await rejectAgent(rejectModal.agentId, rejectReason);
      setAgents(prev => prev.map(a => a.id === rejectModal.agentId ? updated : a));
      setRejectModal(null);
      setRejectReason('');
      fetchStats();
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivate = async (id: string) => {
    setActionLoading(id + '_reactivate');
    try {
      const updated = await reactivateAgent(id);
      setAgents(prev => prev.map(a => a.id === id ? updated : a));
      fetchStats();
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveCommission = async () => {
    if (!commissionModal) return;
    const val = parseFloat(commissionValue);
    if (isNaN(val) || val < 0 || val > 100) return;
    setActionLoading(commissionModal.agent.id + '_commission');
    try {
      const updated = await updateAgent(commissionModal.agent.id, { commissionRate: val });
      setAgents(prev => prev.map(a => a.id === commissionModal.agent.id ? updated : a));
      setCommissionModal(null);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <>
    {/* Reject modal */}
    {rejectModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800">Reject Agent</h3>
            <button onClick={() => setRejectModal(null)} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
          </div>
          <p className="text-sm text-slate-600">Rejecting <strong>{rejectModal.companyName}</strong>. They will be notified by email.</p>
          <textarea rows={3} value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Rejection reason…"
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-primary resize-none" />
          <div className="flex gap-3">
            <button onClick={() => setRejectModal(null)} className="flex-1 border border-slate-200 text-slate-700 py-2.5 rounded-xl font-medium hover:bg-slate-50">Cancel</button>
            <button onClick={handleReject} disabled={!rejectReason.trim() || !!actionLoading}
              className="flex-1 bg-red-600 text-white py-2.5 rounded-xl font-bold hover:bg-red-700 disabled:opacity-50">
              Reject
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Override commission modal */}
    {commissionModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800">Override Commission</h3>
            <button onClick={() => setCommissionModal(null)} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
          </div>
          <p className="text-sm text-slate-600">{commissionModal.agent.companyName} — current: {commissionModal.agent.commissionRate}%</p>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">New Commission Rate (%)</label>
            <input type="number" min="0" max="100" step="0.5" value={commissionValue}
              onChange={e => setCommissionValue(e.target.value)} placeholder={String(commissionModal.agent.commissionRate)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-primary" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setCommissionModal(null)} className="flex-1 border border-slate-200 text-slate-700 py-2.5 rounded-xl font-medium hover:bg-slate-50">Cancel</button>
            <button onClick={handleSaveCommission} disabled={!!actionLoading}
              className="flex-1 bg-brand-primary text-white py-2.5 rounded-xl font-bold disabled:opacity-50">
              Save
            </button>
          </div>
        </div>
      </div>
    )}

    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold text-slate-800">Agent Management</h2>
          <p className="text-slate-500 mt-1">Manage B2B partners and agency approvals</p>
        </div>
        <div className="flex gap-3">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
          <button
            onClick={() => {
              const rows = [['Company','Email','Country','Tier','Markup %','Commission %','Bookings','Status']];
              agents.forEach(a => rows.push([a.companyName,a.email,a.country,a.tier,String(a.markupPercent),String(a.commissionRate),String(a.totalBookings),a.status]));
              const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
              const el = document.createElement('a'); el.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
              el.download = `agents-${new Date().toISOString().split('T')[0]}.csv`; el.click();
            }}
            className="flex items-center gap-2 bg-white text-slate-700 px-4 py-2.5 rounded-xl font-bold border border-slate-200 hover:bg-slate-50 transition-all shadow-sm"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={fetchAgents}
            className="flex items-center gap-2 bg-white text-slate-700 px-4 py-2.5 rounded-xl font-bold border border-slate-200 hover:bg-slate-50 transition-all shadow-sm"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Agents', value: stats.total, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Pending Approvals', value: stats.pending, icon: Shield, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Active Agents', value: stats.active, icon: Globe, color: 'text-green-600', bg: 'bg-green-50' },
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4"
          >
            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', stat.bg)}>
              <stat.icon className={cn('w-6 h-6', stat.color)} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-display font-bold text-slate-800">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by company or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary/10 outline-none"
            />
          </div>
          <span className="text-sm text-slate-400">{total} agents</span>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading agents…</div>
          ) : agents.length === 0 ? (
            <div className="p-12 text-center text-slate-400">No agents found</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="px-6 py-4">Agency Details</th>
                  <th className="px-6 py-4">Tier</th>
                  <th className="px-6 py-4">Markup / Commission</th>
                  <th className="px-6 py-4">Total Bookings</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {agents.map(agent => (
                  <tr key={agent.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-brand-primary font-bold">
                          {agent.companyName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-display font-bold text-slate-800">{agent.companyName}</p>
                          <p className="text-xs text-slate-400">{agent.email}</p>
                          <p className="text-xs text-slate-400">{agent.country}{agent.city ? `, ${agent.city}` : ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn('px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider',
                        TIER_COLORS[agent.tier] ?? 'bg-slate-50 text-slate-600')}>
                        {agent.tier}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <span className="font-mono">{agent.markupPercent}%</span> / <span className="font-mono">{agent.commissionRate}%</span>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-700">{agent.totalBookings}</td>
                    <td className="px-6 py-4">
                      <span className={cn('flex items-center gap-1.5 text-xs font-bold',
                        STATUS_COLORS[agent.status] ?? 'text-slate-600')}>
                        {agent.status === 'ACTIVE' ? <Check className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                        {agent.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1 flex-wrap">
                        {/* View details */}
                        <button onClick={() => navigate(`/admin/agents/${agent.id}`)}
                          className="p-2 text-slate-400 hover:text-brand-primary hover:bg-brand-primary/5 rounded-lg transition-colors" title="View Details">
                          <Eye className="w-4 h-4" />
                        </button>
                        {/* Business proof link */}
                        {agent.businessProofUrl && (
                          <a href={agent.businessProofUrl} target="_blank" rel="noreferrer"
                            className="p-2 text-slate-400 hover:text-brand-primary hover:bg-brand-primary/5 rounded-lg transition-colors" title="View Business Proof">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        {/* Override commission */}
                        <button onClick={() => { setCommissionModal({ agent }); setCommissionValue(String(agent.commissionRate)); }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Override Commission">
                          <Percent className="w-4 h-4" />
                        </button>
                        {/* Approve (PENDING) */}
                        {agent.status === 'PENDING' && (
                          <button onClick={() => handleApprove(agent.id)} disabled={actionLoading === agent.id + '_approve'}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50" title="Approve">
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        {/* Reject (PENDING) */}
                        {agent.status === 'PENDING' && (
                          <button onClick={() => setRejectModal({ agentId: agent.id, companyName: agent.companyName })}
                            className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors" title="Reject">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        {/* Suspend (ACTIVE) */}
                        {agent.status === 'ACTIVE' && (
                          <button onClick={() => handleSuspend(agent.id)} disabled={actionLoading === agent.id + '_suspend'}
                            className="p-2 text-orange-400 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50" title="Suspend">
                            <Shield className="w-4 h-4" />
                          </button>
                        )}
                        {/* Reactivate (SUSPENDED) */}
                        {agent.status === 'SUSPENDED' && (
                          <button onClick={() => handleReactivate(agent.id)} disabled={actionLoading === agent.id + '_reactivate'}
                            className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50" title="Reactivate">
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
