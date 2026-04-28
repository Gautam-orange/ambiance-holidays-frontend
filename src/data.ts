import { Booking, Car, Tour } from './types';

export const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'BK-1023',
    customerName: 'Riya Singh',
    whatsapp: '+231 9876543219',
    orderType: ['Hotel', 'Car Rental', 'Transfers'],
    cancelReason: 'Vehicle not available',
    email: 'rahul@email.com',
    date: '15-Sep-2025',
    paymentStatus: 'Paid',
    bookingStatus: 'Confirmed',
    amount: 7500
  },
  {
    id: 'BK-1024',
    customerName: 'John Doe',
    whatsapp: '+231 9876543210',
    orderType: ['Activities'],
    email: 'john@email.com',
    date: '16-Sep-2025',
    paymentStatus: 'Paid',
    bookingStatus: 'Pending',
    amount: 2500
  }
];

export const MOCK_CARS: Car[] = [
  {
    id: 'CR-101',
    name: 'BMW X7',
    category: 'Luxury',
    year: 2023,
    pax: 7,
    usageType: 'Both',
    perDay: 200,
    perKm: 200,
    status: 'Active',
    image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'CR-102',
    name: 'Hyundai Tucson',
    category: 'Premium',
    year: 2023,
    pax: 5,
    usageType: 'Rental',
    perDay: 150,
    status: 'Active',
    image: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&q=80&w=800'
  }
];

export const MOCK_TOURS: Tour[] = [
  {
    id: 'TOUR-001',
    name: 'Casela Nature Park Adventure',
    price: 5000,
    category: 'Land',
    region: 'South',
    duration: 'Full Day',
    status: 'Active',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'TOUR-002',
    name: 'North Island Speedboat Trip',
    price: 7500,
    category: 'Water',
    region: 'North',
    duration: 'Full Day',
    status: 'Active',
    image: 'https://images.unsplash.com/photo-1567627761166-724896792fc8?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'TOUR-003',
    name: 'Ile aux Cerfs Catamaran Cruise',
    price: 4500,
    category: 'Water',
    region: 'East',
    duration: 'Full Day',
    status: 'Active',
    image: 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&q=80&w=800'
  }
];
