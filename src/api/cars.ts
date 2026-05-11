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

export function getWeeklyRate(car: Car): CarRate | undefined {
  return car.rates.find(r => r.period === 'WEEKLY');
}

export function getMonthlyRate(car: Car): CarRate | undefined {
  return car.rates.find(r => r.period === 'MONTHLY');
}

export interface RateBreakdownItem {
  period: RatePeriod;
  qty: number;
  rateCents: number;
  label: string;
}

export interface BestRentalPrice {
  totalCents: number;
  breakdown: RateBreakdownItem[];
}

/**
 * Compute the cheapest combination of DAILY/WEEKLY/MONTHLY rates that covers
 * the given number of rental days. Falls back to daily-only if other tiers
 * aren't configured. Returns null when there's no daily rate at all.
 */
export function computeBestRentalPrice(car: Car, days: number): BestRentalPrice | null {
  if (days < 1) return null;
  const daily = getDailyRate(car);
  const weekly = getWeeklyRate(car);
  const monthly = getMonthlyRate(car);
  if (!daily) return null;

  let best: BestRentalPrice = {
    totalCents: daily.amountCents * days,
    breakdown: [{ period: 'DAILY', qty: days, rateCents: daily.amountCents, label: `${days} day${days > 1 ? 's' : ''}` }],
  };

  const tryCombo = (months: number, weeks: number, leftover: number) => {
    let total = 0;
    const breakdown: RateBreakdownItem[] = [];
    if (months > 0 && monthly) {
      total += monthly.amountCents * months;
      breakdown.push({ period: 'MONTHLY', qty: months, rateCents: monthly.amountCents, label: `${months} month${months > 1 ? 's' : ''}` });
    }
    if (weeks > 0 && weekly) {
      total += weekly.amountCents * weeks;
      breakdown.push({ period: 'WEEKLY', qty: weeks, rateCents: weekly.amountCents, label: `${weeks} week${weeks > 1 ? 's' : ''}` });
    }
    if (leftover > 0) {
      total += daily.amountCents * leftover;
      breakdown.push({ period: 'DAILY', qty: leftover, rateCents: daily.amountCents, label: `${leftover} day${leftover > 1 ? 's' : ''}` });
    }
    if (total < best.totalCents) best = { totalCents: total, breakdown };
  };

  if (monthly && days >= 30) {
    const months = Math.floor(days / 30);
    const rem = days % 30;
    if (weekly && rem >= 7) {
      const weeks = Math.floor(rem / 7);
      tryCombo(months, weeks, rem % 7);
    }
    tryCombo(months, 0, rem);
  }
  if (weekly && days >= 7) {
    const weeks = Math.floor(days / 7);
    tryCombo(0, weeks, days % 7);
  }
  return best;
}
