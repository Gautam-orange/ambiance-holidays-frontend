import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Edit, UserX, X, Download } from 'lucide-react';
import driversApi, { type DriverRequest, type Driver as DriverType } from '../../api/drivers';
import apiClient from '../../api/client';

type Driver = {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  experienceYears: number;
  licenseNo: string;
  licenseExpiry: string;
  status: 'FREE' | 'PARTIALLY_FREE' | 'BOOKED' | 'OFF_DUTY';
  isActive: boolean;
};

const STATUS_COLORS: Record<string, string> = {
  FREE: 'bg-green-100 text-green-700',
  PARTIALLY_FREE: 'bg-amber-100 text-amber-700',
  BOOKED: 'bg-red-100 text-red-700',
  OFF_DUTY: 'bg-gray-100 text-gray-600',
};

const BLANK_FORM: DriverRequest = {
  firstName: '', lastName: '', phone: '', email: '', address: '',
  licenseNo: '', licenseExpiry: '', experienceYears: 0,
};

export default function DriverList() {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editDriver, setEditDriver] = useState<Driver | null>(null);
  const [deactivateId, setDeactivateId] = useState<string | null>(null);
  const [driverForm, setDriverForm] = useState<DriverRequest>(BLANK_FORM);
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchDrivers = () => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    apiClient.get('/admin/drivers', { params })
      .then(r => setDrivers(r.data?.data?.items ?? r.data?.data?.content ?? []))
      .catch(() => setDrivers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDrivers(); }, [search, statusFilter]);

  const openAdd = () => {
    setDriverForm(BLANK_FORM);
    setFormError('');
    setEditDriver(null);
    setShowAddModal(true);
  };

  const openEdit = (d: Driver) => {
    setDriverForm({
      firstName: d.firstName, lastName: d.lastName, phone: d.phone,
      address: d.address ?? '', licenseNo: d.licenseNo,
      licenseExpiry: d.licenseExpiry, experienceYears: d.experienceYears,
    });
    setFormError('');
    setEditDriver(d);
    setShowAddModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSaving(true);
    setFormError('');
    try {
      if (editDriver) {
        await driversApi.update(editDriver.id, driverForm);
      } else {
        await driversApi.create(driverForm);
      }
      setShowAddModal(false);
      fetchDrivers();
    } catch (err: any) {
      setFormError(err?.response?.data?.error?.message ?? 'Failed to save driver');
    } finally {
      setFormSaving(false);
    }
  };

  const confirmDeactivate = async () => {
    if (!deactivateId) return;
    await apiClient.patch(`/admin/drivers/${deactivateId}/deactivate`);
    setDeactivateId(null);
    fetchDrivers();
  };

  const setField = (k: keyof DriverRequest, v: string | number) =>
    setDriverForm(f => ({ ...f, [k]: v }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Drivers</h1>
          <p className="text-sm text-gray-500 mt-1">Manage driver pool and assignments</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const rows = [['Code','First Name','Last Name','Phone','Licence No','Licence Expiry','Experience (yrs)','Status']];
              drivers.forEach(d => rows.push([d.code||'',d.firstName,d.lastName,d.phone,d.licenseNo,d.licenseExpiry,String(d.experienceYears),d.status]));
              const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
              const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
              a.download = `drivers-${new Date().toISOString().split('T')[0]}.csv`; a.click();
            }}
            className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm"
          >
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={openAdd} className="flex items-center gap-2 bg-brand-primary text-white px-4 py-2.5 rounded-lg font-medium hover:bg-brand-primary/90 transition-colors text-sm">
            <Plus className="w-4 h-4" /> Add Driver
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search by name, ID, licence…" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary">
          <option value="">All Status</option>
          <option value="FREE">Free</option>
          <option value="PARTIALLY_FREE">Partially Free</option>
          <option value="BOOKED">Booked</option>
          <option value="OFF_DUTY">Off Duty</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Driver ID</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Experience</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Licence No</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Licence Expiry</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">Loading…</td></tr>
            ) : drivers.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center">
                  <p className="text-gray-400 mb-3">No drivers added yet</p>
                  <button onClick={openAdd} className="text-brand-primary font-medium hover:underline text-sm">Add your first driver</button>
                </td>
              </tr>
            ) : drivers.map(driver => (
              <tr key={driver.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{driver.code || 'DRV-' + driver.id.slice(0, 6)}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{driver.firstName} {driver.lastName}</td>
                <td className="px-4 py-3 text-gray-600">{driver.phone}</td>
                <td className="px-4 py-3 text-gray-600">{driver.experienceYears} yr{driver.experienceYears !== 1 ? 's' : ''}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-600">{driver.licenseNo}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{driver.licenseExpiry}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[driver.status] || 'bg-gray-100 text-gray-600'}`}>
                    {driver.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => navigate(`/admin/drivers/${driver.id}`)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="View activity">
                      <Eye className="w-4 h-4 text-gray-500" />
                    </button>
                    <button onClick={() => openEdit(driver)} className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors" title="Edit driver">
                      <Edit className="w-4 h-4 text-blue-500" />
                    </button>
                    <button onClick={() => setDeactivateId(driver.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors" title="Deactivate">
                      <UserX className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Driver Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-lg">{editDriver ? 'Edit Driver' : 'Add Driver'}</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {formError && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{formError}</div>}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">First Name *</label>
                  <input required value={driverForm.firstName} onChange={e => setField('firstName', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Last Name *</label>
                  <input required value={driverForm.lastName} onChange={e => setField('lastName', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Phone *</label>
                  <input required value={driverForm.phone} onChange={e => setField('phone', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
                  <input type="email" value={driverForm.email ?? ''} onChange={e => setField('email', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Licence No *</label>
                  <input required value={driverForm.licenseNo} onChange={e => setField('licenseNo', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Licence Expiry *</label>
                  <input required type="date" value={driverForm.licenseExpiry} onChange={e => setField('licenseExpiry', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Experience (years) *</label>
                  <input required type="number" min={0} value={driverForm.experienceYears} onChange={e => setField('experienceYears', Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Address</label>
                  <input value={driverForm.address ?? ''} onChange={e => setField('address', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={formSaving} className="flex-1 bg-brand-primary text-white py-2.5 rounded-xl font-semibold hover:bg-brand-primary/90 disabled:opacity-50">
                  {formSaving ? 'Saving…' : editDriver ? 'Save Changes' : 'Add Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deactivate confirmation */}
      {deactivateId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="font-semibold text-gray-900 mb-2">Deactivate Driver?</h3>
            <p className="text-sm text-gray-500 mb-5">This driver will no longer appear for new assignments. Future confirmed bookings must be re-assigned first.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeactivateId(null)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={confirmDeactivate} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700">Deactivate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
