import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X, Shield, RotateCcw } from 'lucide-react';
import { getAgent, approveAgent, suspendAgent, rejectAgent, reactivateAgent, type Agent } from '../../api/agents';

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-50 text-green-700',
  PENDING: 'bg-amber-50 text-amber-700',
  SUSPENDED: 'bg-red-50 text-red-700',
};

export default function AgentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);

  useEffect(() => {
    if (!id) return;
    getAgent(id)
      .then(setAgent)
      .catch(() => setError('Failed to load agent'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleApprove = async () => {
    if (!id) return;
    setActionLoading(true);
    try { setAgent(await approveAgent(id)); } finally { setActionLoading(false); }
  };

  const handleSuspend = async () => {
    if (!id || !confirm('Suspend this agent?')) return;
    setActionLoading(true);
    try { setAgent(await suspendAgent(id)); } finally { setActionLoading(false); }
  };

  const handleReactivate = async () => {
    if (!id) return;
    setActionLoading(true);
    try { setAgent(await reactivateAgent(id)); } finally { setActionLoading(false); }
  };

  const handleReject = async () => {
    if (!id || !rejectReason.trim()) return;
    setActionLoading(true);
    try { setAgent(await rejectAgent(id, rejectReason)); setShowReject(false); setRejectReason(''); } finally { setActionLoading(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!agent) return <div className="text-center py-20 text-gray-500">{error || 'Agent not found.'}</div>;

  return (
    <div className="max-w-3xl space-y-6">
      {/* Reject modal */}
      {showReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">Reject Agent</h3>
              <button onClick={() => setShowReject(false)} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <textarea rows={3} value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Rejection reason…"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-primary resize-none" />
            <div className="flex gap-3">
              <button onClick={() => setShowReject(false)} className="flex-1 border border-slate-200 text-slate-700 py-2.5 rounded-xl font-medium hover:bg-slate-50">Cancel</button>
              <button onClick={handleReject} disabled={!rejectReason.trim() || actionLoading}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-xl font-bold hover:bg-red-700 disabled:opacity-50">Reject</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/admin/agents')} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5 text-gray-500" /></button>
        <h1 className="text-2xl font-bold text-gray-900">Agent Details</h1>
      </div>

      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>}

      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-brand-primary font-bold text-2xl">
              {agent.companyName.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">{agent.companyName}</h2>
              <p className="text-sm text-slate-500">{agent.email}</p>
              <p className="text-sm text-slate-500">{agent.country}{agent.city ? `, ${agent.city}` : ''}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${STATUS_COLORS[agent.status] ?? 'bg-slate-100 text-slate-600'}`}>{agent.status}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
          <div><p className="text-xs text-slate-400 uppercase tracking-wider">Contact Person</p><p className="font-medium text-slate-700">{agent.firstName} {agent.lastName}</p></div>
          <div><p className="text-xs text-slate-400 uppercase tracking-wider">Phone</p><p className="font-medium text-slate-700">{agent.phone ?? '—'}</p></div>
          <div><p className="text-xs text-slate-400 uppercase tracking-wider">WhatsApp</p><p className="font-medium text-slate-700">{agent.whatsapp ?? '—'}</p></div>
          <div><p className="text-xs text-slate-400 uppercase tracking-wider">Business Type</p><p className="font-medium text-slate-700">{agent.businessType ? agent.businessType.replaceAll('_', ' ') : '—'}</p></div>
          <div><p className="text-xs text-slate-400 uppercase tracking-wider">Country / City</p><p className="font-medium text-slate-700">{agent.country}{agent.city ? `, ${agent.city}` : ''}</p></div>
          <div className="col-span-2"><p className="text-xs text-slate-400 uppercase tracking-wider">Address</p><p className="font-medium text-slate-700">{(agent as any).address ?? '—'}</p></div>
          <div><p className="text-xs text-slate-400 uppercase tracking-wider">Total Bookings</p><p className="font-bold text-slate-800">{agent.totalBookings}</p></div>
          <div><p className="text-xs text-slate-400 uppercase tracking-wider">Approved At</p><p className="font-medium text-slate-700">{agent.approvedAt ? new Date(agent.approvedAt).toLocaleDateString() : '—'}</p></div>
          <div><p className="text-xs text-slate-400 uppercase tracking-wider">Registered</p><p className="font-medium text-slate-700">{new Date(agent.createdAt).toLocaleDateString()}</p></div>
          {agent.businessProofUrl && (
            <div><p className="text-xs text-slate-400 uppercase tracking-wider">Business Proof</p>
              <a href={agent.businessProofUrl} target="_blank" rel="noreferrer" className="text-brand-primary text-sm hover:underline">View Document</a>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-slate-100 flex-wrap">
          {agent.status === 'PENDING' && (
            <>
              <button onClick={handleApprove} disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                <Check className="w-4 h-4" /> Approve
              </button>
              <button onClick={() => setShowReject(true)} disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                <X className="w-4 h-4" /> Reject
              </button>
            </>
          )}
          {agent.status === 'ACTIVE' && (
            <button onClick={handleSuspend} disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600 disabled:opacity-50">
              <Shield className="w-4 h-4" /> Suspend
            </button>
          )}
          {agent.status === 'SUSPENDED' && (
            <button onClick={handleReactivate} disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50">
              <RotateCcw className="w-4 h-4" /> Reactivate
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
