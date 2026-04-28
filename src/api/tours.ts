import api from './client';

export interface ItineraryStop {
  id: string;
  stopTime: string;
  title: string;
  description: string;
  sortOrder: number;
}

export interface PickupZone {
  id: string;
  zoneName: string;
  extraCents: number;
  pickupTime: string | null;
}

export interface Tour {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: 'LAND' | 'SEA' | 'AIR';
  region: 'NORTH' | 'SOUTH' | 'EAST' | 'WEST' | 'CENTRAL';
  duration: 'HALF_DAY' | 'FULL_DAY';
  durationHours: number | null;
  adultPriceCents: number;
  childPriceCents: number;
  infantPriceCents: number;
  minPax: number;
  maxPax: number;
  includes: string[] | null;
  excludes: string[] | null;
  importantNotes: string[] | null;
  coverImageUrl: string | null;
  galleryUrls: string[] | null;
  status: 'ACTIVE' | 'ON_REQUEST' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
  itineraryStops: ItineraryStop[];
  pickupZones: PickupZone[];
}

export interface DayTrip {
  id: string;
  title: string;
  slug: string;
  description: string;
  tripType: 'SHARED' | 'PRIVATE';
  region: 'NORTH' | 'SOUTH' | 'EAST' | 'WEST' | 'CENTRAL';
  duration: 'HALF_DAY' | 'FULL_DAY';
  adultPriceCents: number;
  childPriceCents: number;
  maxPax: number | null;
  includes: string[] | null;
  excludes: string[] | null;
  coverImageUrl: string | null;
  galleryUrls: string[] | null;
  status: 'ACTIVE' | 'ON_REQUEST' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface TransferRoute {
  id: string;
  fromLocation: string;
  toLocation: string;
  tripType: string;
  carCategory: string;
  basePriceCents: number;
  estDurationMins: number | null;
  estKm: number | null;
  active: boolean;
}

export interface TourFilters {
  search?: string;
  category?: string;
  region?: string;
  duration?: string;
  status?: string;
  page?: number;
  size?: number;
}

// Catalog (public)
export const catalogTours = (filters: TourFilters = {}) =>
  api.get('/catalog/tours', { params: filters }).then(r => r.data);

export const catalogTourBySlug = (slug: string) =>
  api.get(`/catalog/tours/${slug}`).then(r => r.data);

export const catalogDayTrips = (filters: Omit<TourFilters, 'category'> & { tripType?: string } = {}) =>
  api.get('/catalog/day-trips', { params: filters }).then(r => r.data);

export const catalogTransfers = (from?: string, to?: string) =>
  api.get('/catalog/transfers', { params: { from, to } }).then(r => r.data);

// Admin tours
export const adminListTours = (filters: TourFilters = {}) =>
  api.get('/admin/tours', { params: filters }).then(r => r.data);

export const adminGetTour = (id: string) =>
  api.get(`/admin/tours/${id}`).then(r => r.data);

export const adminCreateTour = (data: Partial<Tour> & { itineraryStops?: Partial<ItineraryStop>[]; pickupZones?: Partial<PickupZone>[] }) =>
  api.post('/admin/tours', data).then(r => r.data);

export const adminUpdateTour = (id: string, data: Partial<Tour>) =>
  api.put(`/admin/tours/${id}`, data).then(r => r.data);

export const adminDeleteTour = (id: string) =>
  api.delete(`/admin/tours/${id}`).then(r => r.data);

// Admin day trips
export const adminListDayTrips = (filters: TourFilters = {}) =>
  api.get('/admin/day-trips', { params: filters }).then(r => r.data);

export const adminCreateDayTrip = (data: Partial<DayTrip>) =>
  api.post('/admin/day-trips', data).then(r => r.data);

export const adminUpdateDayTrip = (id: string, data: Partial<DayTrip>) =>
  api.put(`/admin/day-trips/${id}`, data).then(r => r.data);

export const adminDeleteDayTrip = (id: string) =>
  api.delete(`/admin/day-trips/${id}`).then(r => r.data);

// Admin transfers
export const adminListTransfers = () =>
  api.get('/admin/transfers').then(r => r.data);

export const adminCreateTransfer = (data: Partial<TransferRoute>) =>
  api.post('/admin/transfers', data).then(r => r.data);

export const adminUpdateTransfer = (id: string, data: Partial<TransferRoute>) =>
  api.put(`/admin/transfers/${id}`, data).then(r => r.data);

export const adminDeleteTransfer = (id: string) =>
  api.delete(`/admin/transfers/${id}`).then(r => r.data);
