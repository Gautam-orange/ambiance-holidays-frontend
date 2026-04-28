import apiClient from './client';

export type DriverStatus = 'FREE' | 'PARTIALLY_FREE' | 'BOOKED' | 'OFF_DUTY';

export interface Driver {
  id: string;
  code?: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  email?: string;
  address?: string;
  licenseNo: string;
  licenseExpiry: string;
  experienceYears: number;
  status: DriverStatus;
  photoUrl?: string;
  active: boolean;
}

export interface Assignment {
  id: string;
  driverId: string;
  driverName: string;
  bookingItemId: string;
  carId?: string;
  carName?: string;
  carRegistrationNo?: string;
  startAt: string;
  endAt: string;
  pickupAddress?: string;
  dropoffAddress?: string;
  notes?: string;
  assignedAt: string;
}

export interface DriverRequest {
  code?: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address?: string;
  licenseNo: string;
  licenseExpiry: string;
  experienceYears: number;
  photoUrl?: string;
}

export interface AssignDriverRequest {
  driverId: string;
  carId: string;
  startAt: string;
  endAt: string;
  pickupAddress?: string;
  dropoffAddress?: string;
  notes?: string;
}

const driversApi = {
  list: (params?: { page?: number; size?: number; search?: string; status?: string }) =>
    apiClient.get<{ success: boolean; data: { items: Driver[]; meta: any } }>('/admin/drivers', { params }),

  get: (id: string) =>
    apiClient.get<{ success: boolean; data: { driver: Driver; assignments: Assignment[] } }>(`/admin/drivers/${id}`),

  create: (data: DriverRequest) =>
    apiClient.post<{ success: boolean; data: Driver }>('/admin/drivers', data),

  update: (id: string, data: DriverRequest) =>
    apiClient.put<{ success: boolean; data: Driver }>(`/admin/drivers/${id}`, data),

  delete: (id: string) =>
    apiClient.delete(`/admin/drivers/${id}`),

  updateStatus: (id: string, status: DriverStatus) =>
    apiClient.patch<{ success: boolean; data: Driver }>(`/admin/drivers/${id}/status`, null, { params: { status } }),

  listAvailable: (from: string, to: string) =>
    apiClient.get<{ success: boolean; data: Driver[] }>('/admin/drivers/available', { params: { from, to } }),

  assignDriver: (bookingItemId: string, data: AssignDriverRequest) =>
    apiClient.post<{ success: boolean; data: Assignment }>(`/admin/drivers/assignments/${bookingItemId}/assign`, data),

  removeAssignment: (assignmentId: string) =>
    apiClient.delete(`/admin/drivers/assignments/${assignmentId}`),
};

export default driversApi;

export const STATUS_COLORS: Record<DriverStatus, string> = {
  FREE: 'bg-green-100 text-green-700',
  PARTIALLY_FREE: 'bg-yellow-100 text-yellow-700',
  BOOKED: 'bg-red-100 text-red-700',
  OFF_DUTY: 'bg-slate-100 text-slate-500',
};
