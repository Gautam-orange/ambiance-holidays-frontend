import React from 'react';

export interface Booking {
  id: string;
  customerName: string;
  whatsapp: string;
  orderType: string[];
  cancelReason?: string;
  email: string;
  date: string;
  paymentStatus: 'Paid' | 'Failed' | 'Pending';
  bookingStatus: 'Confirmed' | 'Cancelled' | 'Pending';
  amount: number;
}

export interface Car {
  id: string;
  name: string;
  category: string;
  year: number;
  pax: number;
  usageType: 'Rental' | 'Transfer' | 'Both';
  perDay: number;
  perKm?: number;
  status: 'Active' | 'Inactive';
  image: string;
}

export interface Tour {
  id: string;
  name: string;
  price: number;
  category: string;
  region: string;
  duration: string;
  status: 'Active' | 'On Request';
  image: string;
}
