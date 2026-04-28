import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Car,
  Palmtree,
  Users,
  Bell,
  LogOut,
  ChevronDown,
  ChevronRight,
  Settings,
  User,
  UserCheck,
  Map,
  Mail,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

function CollapsibleNav({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200"
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span className="flex-1 text-left">{label}</span>
        {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
      {open && <div className="ml-8 mt-1 space-y-1">{children}</div>}
    </div>
  );
}

function SubLink({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => cn(
        'block px-3 py-2 rounded-lg text-sm transition-all text-slate-400 hover:text-white hover:bg-white/5',
        isActive && 'text-white font-medium bg-white/10'
      )}
    >
      {label}
    </NavLink>
  );
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
  };

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || user.email[0].toUpperCase()
    : 'A';

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-brand-900 text-white flex flex-col flex-shrink-0 overflow-y-auto">
        <div className="p-6 flex-1">
          <div className="mb-8">
            <img src="/images/logo.png" alt="Ambiance Holidays" className="h-10 w-auto brightness-0 invert" />
          </div>

          <nav className="space-y-1">
            <NavLink
              to="/admin"
              end
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-slate-400 hover:text-white hover:bg-white/5',
                isActive && 'bg-white/10 text-white font-medium'
              )}
            >
              <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
              <span>Dashboard</span>
            </NavLink>

            {/* Bookings Management — collapsible with Drivers child */}
            <CollapsibleNav icon={ClipboardList} label="Bookings Management">
              <SubLink to="/admin/bookings" label="All Bookings" />
              <SubLink to="/admin/drivers" label="Drivers" />
            </CollapsibleNav>

            <NavLink
              to="/admin/cars"
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-slate-400 hover:text-white hover:bg-white/5',
                isActive && 'bg-white/10 text-white font-medium'
              )}
            >
              <Car className="w-5 h-5 flex-shrink-0" />
              <span>Car Management</span>
            </NavLink>

            {/* Activities — collapsible with Day Trip + Tours children */}
            <CollapsibleNav icon={Palmtree} label="Activities">
              <SubLink to="/admin/day-trips" label="Day Trips" />
              <SubLink to="/admin/activities" label="Tours" />
            </CollapsibleNav>

            <NavLink
              to="/admin/transfer-pricing"
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-slate-400 hover:text-white hover:bg-white/5',
                isActive && 'bg-white/10 text-white font-medium'
              )}
            >
              <Map className="w-5 h-5 flex-shrink-0" />
              <span>Transfer Pricing</span>
            </NavLink>

            <NavLink
              to="/admin/agents"
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-slate-400 hover:text-white hover:bg-white/5',
                isActive && 'bg-white/10 text-white font-medium'
              )}
            >
              <UserCheck className="w-5 h-5 flex-shrink-0" />
              <span>Agent Management</span>
            </NavLink>
          </nav>
        </div>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 p-2">
            <div className="w-10 h-10 rounded-full bg-brand-primary/20 flex items-center justify-center border border-brand-primary/30">
              <span className="text-brand-primary font-semibold text-sm">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email : 'Admin'}</p>
              <p className="text-xs text-slate-400">{user?.role?.replace('_', ' ') ?? ''}</p>
            </div>
            <button onClick={handleLogout} className="text-slate-400 hover:text-white transition-colors" title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10 flex-shrink-0">
          <h1 className="font-semibold text-lg text-slate-800">Ambiance Holidays Admin</h1>

          <div className="flex items-center gap-4">
            <button className="relative text-slate-500 hover:text-brand-primary">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>

            {/* Settings gear — NOT in sidebar, in topbar */}
            <Link to="/admin/settings" className="text-slate-500 hover:text-brand-primary transition-colors" title="Settings">
              <Settings className="w-5 h-5" />
            </Link>

            {/* Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(m => !m)}
                className="flex items-center gap-2 text-slate-700 hover:text-slate-900"
              >
                <div className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center">
                  <span className="text-brand-primary font-semibold text-xs">{initials}</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
              {showProfileMenu && (
                <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                  <Link to="/admin/settings" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                    <Settings className="w-4 h-4" /> Settings
                  </Link>
                  <Link to="/admin/newsletter" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                    <Mail className="w-4 h-4" /> Newsletter
                  </Link>
                  <hr className="my-1 border-gray-100" />
                  <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
