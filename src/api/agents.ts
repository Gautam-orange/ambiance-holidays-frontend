import apiClient from './client';

export interface Agent {
  id: string;
  companyName: string;
  country: string;
  city: string | null;
  businessType: string;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
  markupPercent: number;
  commissionRate: number;
  creditLimit: number;
  totalBookings: number;
  businessProofUrl: string | null;
  approvedAt: string | null;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  createdAt: string;
}

export interface AgentStats {
  total: number;
  pending: number;
  active: number;
  suspended: number;
}

export const listAgents = (params?: {
  search?: string;
  status?: string;
  tier?: string;
  page?: number;
  size?: number;
}) => apiClient.get('/admin/agents', { params }).then(r => r.data);

export const getAgent = (id: string) =>
  apiClient.get(`/admin/agents/${id}`).then(r => r.data.data as Agent);

export const approveAgent = (id: string) =>
  apiClient.post(`/admin/agents/${id}/approve`).then(r => r.data.data as Agent);

export const suspendAgent = (id: string) =>
  apiClient.post(`/admin/agents/${id}/suspend`).then(r => r.data.data as Agent);

export const rejectAgent = (id: string, reason: string) =>
  apiClient.post(`/admin/agents/${id}/reject`, { reason }).then(r => r.data.data as Agent);

export const reactivateAgent = (id: string) =>
  apiClient.post(`/admin/agents/${id}/reactivate`).then(r => r.data.data as Agent);

export const updateAgent = (id: string, data: {
  tier?: string;
  markupPercent?: number;
  commissionRate?: number;
  creditLimit?: number;
}) => apiClient.patch(`/admin/agents/${id}`, data).then(r => r.data.data as Agent);

export const getAgentStats = () =>
  apiClient.get('/admin/agents/stats').then(r => r.data.data as AgentStats);

export const getDashboardStats = () =>
  apiClient.get('/admin/dashboard').then(r => r.data.data as {
    bookings: { total: number; pending: number; confirmed: number; cancelled: number };
    revenue: { total: number; thisMonth: number };
    agents: { total: number; pending: number; active: number };
    assets: { activeCars: number; activeTours: number };
  });
