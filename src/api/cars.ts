import apiClient from './client';

export type CarCategory = 'ECONOMY' | 'STANDARD' | 'PREMIUM' | 'LUXURY' | 'SUV' | 'MINIVAN';
export type CarUsageType = 'RENTAL' | 'TRANSFER' | 'BOTH';
export type CarStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
export type RatePeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'PER_KM';

export interface CarRate {
  id: string;
  period: RatePeriod;
  amountCents: number;
  kmFrom?: number;
  kmTo?: number;
}

export interface Car {
  id: string;
  registrationNo: string;
  name: string;
  category: CarCategory;
  usageType: CarUsageType;
  year: number;
  passengerCapacity: number;
  luggageCapacity?: number;
  hasAc: boolean;
  automatic: boolean;
  /** Gear count (5 / 6 / 8 etc.). Null when unknown. */
  transmissionGears?: number | null;
  fuelType: string;
  color?: string;
  description?: string;
  coverImageUrl?: string;
  galleryUrls: string[];
  includes: string[];
  excludes: string[];
  status: CarStatus;
  supplierName?: string;
  supplierId?: string;
  rates: CarRate[];
  extraServices?: CarExtraService[];
  createdAt: string;
}

export interface CarRateRequest {
  period: RatePeriod;
  amountCents: number;
  kmFrom?: number;
  kmTo?: number;
}

export interface CarExtraServiceRequest {
  name: string;
  priceCents: number;
}

export interface CarExtraService {
  id: string;
  name: string;
  priceCents: number;
  displayOrder: number;
}

export interface CarRequest {
  registrationNo: string;
  name: string;
  category: CarCategory;
  usageType: CarUsageType;
  year: number;
  passengerCapacity: number;
  luggageCapacity?: number;
  hasAc?: boolean;
  automatic?: boolean;
  transmissionGears?: number;
  fuelType?: string;
  color?: string;
  description?: string;
  coverImageUrl?: string;
  galleryUrls?: string[];
  includes?: string[];
  excludes?: string[];
  supplierId?: string;
  rates: CarRateRequest[];
  extraServices?: CarExtraServiceRequest[];
  status?: CarStatus;
}

export interface SupplierOption {
  id: string;
  name: string;
}

export interface PageMeta {
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

export interface CarsPage {
  items: Car[];
  meta: PageMeta;
}

export interface BlockedRange {
  availabilityId: string;
  dateFrom: string;
  dateTo: string;
  reason: string;
}

export interface CarCalendarRow {
  carId: string;
  registrationNo: string;
  name: string;
  coverImageUrl?: string;
  category: string;
  blockedRanges: BlockedRange[];
}

export interface AvailabilityCalendar {
  year: number;
  month: number;
  daysInMonth: number;
  cars: CarCalendarRow[];
}

const carsApi = {
  // Admin
  list: (params?: { page?: number; size?: number; search?: string; category?: string; usageType?: string }) =>
    apiClient.get<{ success: boolean; data: CarsPage }>('/admin/cars', { params }),

  get: (id: string) =>
    apiClient.get<{ success: boolean; data: Car }>(`/admin/cars/${id}`),

  create: (data: CarRequest) =>
    apiClient.post<{ success: boolean; data: Car }>('/admin/cars', data),

  update: (id: string, data: CarRequest) =>
    apiClient.put<{ success: boolean; data: Car }>(`/admin/cars/${id}`, data),

  delete: (id: string) =>
    apiClient.delete(`/admin/cars/${id}`),

  toggleStatus: (id: string) =>
    apiClient.patch<{ success: boolean; data: Car }>(`/admin/cars/${id}/status`),

  getAvailabilityCalendar: (year: number, month: number) =>
    apiClient.get<{ success: boolean; data: AvailabilityCalendar }>('/admin/cars/availability', { params: { year, month } }),

  blockDates: (carId: string, dateFrom: string, dateTo: string, reason?: string) =>
    apiClient.post<{ success: boolean; data: BlockedRange }>(`/admin/cars/${carId}/availability/block`, { dateFrom, dateTo, reason }),

  unblockDates: (availabilityId: string) =>
    apiClient.delete(`/admin/cars/availability/${availabilityId}`),

  // Catalog (public)
  catalogList: (params?: { page?: number; size?: number; category?: string; minPax?: number; dateFrom?: string; dateTo?: string }) =>
    apiClient.get<{ success: boolean; data: CarsPage }>('/catalog/cars', { params }),

  catalogGet: (id: string) =>
    apiClient.get<{ success: boolean; data: Car }>(`/catalog/cars/${id}`),

  listSuppliers: () =>
    apiClient.get<{ success: boolean; data: SupplierOption[] }>('/admin/suppliers'),
};

export default carsApi;

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function getDailyRate(car: Car): CarRate | undefined {
  return car.rates.find(r => r.period === 'DAILY');
}
