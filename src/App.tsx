import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import HomeLayout from './layouts/HomeLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Admin Pages
import Dashboard from './pages/admin/Dashboard';
import BookingsManagement from './pages/admin/BookingsManagement';
import BookingDetails from './pages/admin/BookingDetails';
import CarManagement from './pages/admin/CarManagement';
import AddCar from './pages/admin/AddCar';
import CarAvailability from './pages/admin/CarAvailability';
import CarDetail from './pages/admin/CarDetail';
import ToursManagement from './pages/admin/ToursManagement';
import AgentManagement from './pages/admin/AgentManagement';
import AgentDetail from './pages/admin/AgentDetail';
import AddTour from './pages/admin/AddTour';
import EditTour from './pages/admin/EditTour';
import DayTripManagement from './pages/admin/DayTripManagement';
import AddDayTrip from './pages/admin/AddDayTrip';
import EditDayTrip from './pages/admin/EditDayTrip';
import AdminSettings from './pages/admin/AdminSettings';
import AdminNewsletterPage from './pages/admin/AdminNewsletterPage';
import TransferPricingManagement from './pages/admin/TransferPricingManagement';

// Agent Portal Pages
import MyBookings from './pages/agent/MyBookings';
import AgentProfile from './pages/agent/AgentProfile';

// Home Pages
import Home from './pages/Home';
import CarRentalDetails from './pages/CarRentalDetails';
import CarRental from './pages/CarRental';
import Tours from './pages/Tours';
import TourDetails from './pages/TourDetails';
import DayTrips from './pages/DayTrips';
import DayTripDetails from './pages/DayTripDetails';
import Transfers from './pages/Transfers';
import TransferDetails from './pages/TransferDetails';
import Accommodation from './pages/Accommodation';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import ContactPage from './pages/ContactPage';
import AboutPage from './pages/AboutPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import WeddingPage from './pages/WeddingPage';
import MicePage from './pages/MicePage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentFailurePage from './pages/PaymentFailurePage';
import PaymentReturnPage from './pages/PaymentReturnPage';
import NewsletterConfirm from './pages/NewsletterConfirm';

// Auth Pages
import Login from './pages/auth/Login';
import AgentRegister from './pages/auth/AgentRegister';
import ForgotPassword from './pages/auth/ForgotPassword';
import EmailVerificationPage from './pages/auth/EmailVerificationPage';

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN_OPS', 'FLEET_MANAGER'];
const AGENT_ROLES = ['B2B_AGENT', 'SUPER_ADMIN', 'ADMIN_OPS'];

export default function App() {
  return (
    <Routes>
        {/* Auth Routes */}
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/agent-register" element={<AgentRegister />} />
        <Route path="/auth/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-email/:token" element={<EmailVerificationPage />} />

        {/* Admin Routes — protected, admin roles only */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={ADMIN_ROLES}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="bookings" element={<BookingsManagement />} />
          <Route path="bookings/:id" element={<BookingDetails />} />
          <Route path="cars" element={<CarManagement />} />
          <Route path="cars/add" element={<AddCar />} />
          <Route path="cars/availability" element={<CarAvailability />} />
          <Route path="cars/:id" element={<CarDetail />} />
          <Route path="activities" element={<ToursManagement />} />
          <Route path="activities/add" element={<AddTour />} />
          <Route path="activities/edit/:id" element={<EditTour />} />
          <Route path="day-trips" element={<DayTripManagement />} />
          <Route path="day-trips/add" element={<AddDayTrip />} />
          <Route path="day-trips/:id/edit" element={<EditDayTrip />} />
          <Route path="agents" element={<AgentManagement />} />
          <Route path="agents/:id" element={<AgentDetail />} />
          <Route path="transfer-pricing" element={<TransferPricingManagement />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="newsletter" element={<AdminNewsletterPage />} />
        </Route>

        {/* Public Site Routes (also hosts /agent/* so the top menu stays visible) */}
        <Route path="/" element={<HomeLayout />}>
          <Route index element={<Home />} />
          <Route path="car-rental" element={<CarRental />} />
          <Route path="car-rental/:id" element={<CarRentalDetails />} />
          <Route path="tours" element={<Tours />} />
          <Route path="tours/:slug" element={<TourDetails />} />
          <Route path="day-trips" element={<DayTrips />} />
          <Route path="day-trips/:slug" element={<DayTripDetails />} />
          <Route path="transfers" element={<Transfers />} />
          <Route path="transfers/:id" element={<TransferDetails />} />
          <Route path="accommodation" element={<Accommodation />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="terms" element={<TermsPage />} />
          <Route path="privacy" element={<PrivacyPage />} />
          <Route path="wedding" element={<WeddingPage />} />
          <Route path="mice" element={<MicePage />} />
          <Route path="payment/return" element={<PaymentReturnPage />} />
          <Route path="payment/success" element={<PaymentSuccessPage />} />
          <Route path="payment/failure" element={<PaymentFailurePage />} />
          <Route path="newsletter/confirm/:token" element={<NewsletterConfirm />} />

          {/* Agent Portal — same top header as the public site so the menu stays visible */}
          <Route
            path="agent"
            element={<ProtectedRoute allowedRoles={AGENT_ROLES}><Navigate to="/agent/bookings" replace /></ProtectedRoute>}
          />
          <Route
            path="agent/bookings"
            element={<ProtectedRoute allowedRoles={AGENT_ROLES}><MyBookings /></ProtectedRoute>}
          />
          <Route
            path="agent/profile"
            element={<ProtectedRoute allowedRoles={AGENT_ROLES}><AgentProfile /></ProtectedRoute>}
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
  );
}
