import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Calendar, Clock, ChevronLeft, Car, Shield } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useParams, useNavigate } from 'react-router-dom';
import driversApi, { Driver, Assignment, STATUS_COLORS } from '../../api/drivers';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export default function DriverActivity() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    driversApi.get(id).then(res => {
      setDriver(res.data.data.driver);
      setAssignments(res.data.data.assignments);
    }).finally(() => setIsLoading(false));
  }, [id]);

  const handleRemoveAssignment = async (assignmentId: string) => {
    if (!confirm('Remove this assignment?')) return;
    await driversApi.removeAssignment(assignmentId);
    setAssignments(prev => prev.filter(a => a.id !== assignmentId));
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 bg-slate-200 rounded w-48" />
        <div className="h-48 bg-slate-100 rounded-3xl" />
        <div className="h-64 bg-slate-100 rounded-3xl" />
      </div>
    );
  }

  if (!driver) {
    return <div className="text-center py-24 text-slate-400 font-medium">Driver not found.</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-lg transition-all">
          <ChevronLeft className="w-5 h-5 text-slate-500" />
        </button>
        <div>
          <h2 className="text-3xl font-display font-bold text-slate-800">{driver.fullName}</h2>
          <p className="text-slate-500 mt-0.5">{driver.code || 'No code assigned'}</p>
        </div>
        <span className={cn("ml-auto px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider", STATUS_COLORS[driver.status])}>
          {driver.status.replace('_', ' ')}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Profile Card */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200">
            <div className="flex items-start gap-6 mb-8">
              <div className="w-20 h-20 rounded-2xl bg-slate-100 overflow-hidden flex-shrink-0">
                {driver.photoUrl
                  ? <img src={driver.photoUrl} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-slate-400 text-2xl font-bold">
                      {driver.firstName[0]}{driver.lastName[0]}
                    </div>
                }
              </div>
              <div className="grid grid-cols-2 gap-6 flex-1">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Phone</p>
                  <div className="flex items-center gap-2 text-slate-700 font-medium text-sm">
                    <Phone className="w-3.5 h-3.5 text-brand-primary" />{driver.phone}
                  </div>
                </div>
                {driver.email && (
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Email</p>
                    <div className="flex items-center gap-2 text-slate-700 font-medium text-sm">
                      <Mail className="w-3.5 h-3.5 text-brand-primary" />{driver.email}
                    </div>
                  </div>
                )}
                {driver.address && (
                  <div className="space-y-1 col-span-2">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Address</p>
                    <div className="flex items-center gap-2 text-slate-700 text-sm">
                      <MapPin className="w-3.5 h-3.5 text-brand-primary flex-shrink-0" />{driver.address}
                    </div>
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">License</p>
                  <div className="flex items-center gap-2 text-slate-700 font-medium text-sm">
                    <Shield className="w-3.5 h-3.5 text-brand-primary" />{driver.licenseNo}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">License Expiry</p>
                  <p className="text-sm font-medium text-slate-700">{formatDate(driver.licenseExpiry)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Experience</p>
                  <p className="font-bold text-brand-primary">{driver.experienceYears}+ Years</p>
                </div>
              </div>
            </div>
          </div>

          {/* Assignments */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-slate-800">Assignment History</h3>
              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                {assignments.length} total
              </span>
            </div>

            {assignments.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">No assignments yet.</p>
            ) : (
              <div className="space-y-4">
                {assignments.map(a => {
                  const isPast = new Date(a.endAt) < new Date();
                  return (
                    <div key={a.id} className={cn(
                      "p-5 rounded-2xl border transition-all",
                      isPast ? "border-slate-100 bg-slate-50" : "border-brand-primary/20 bg-brand-primary/5"
                    )}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          {a.carName && (
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                              <Car className="w-4 h-4 text-brand-primary" />
                              {a.carName} {a.carRegistrationNo && <span className="text-xs text-slate-400 font-normal">({a.carRegistrationNo})</span>}
                            </div>
                          )}
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {formatDate(a.startAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {formatTime(a.startAt)} → {formatTime(a.endAt)}
                            </span>
                          </div>
                          {a.pickupAddress && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-400">
                              <MapPin className="w-3 h-3" />{a.pickupAddress}
                              {a.dropoffAddress && <span>→ {a.dropoffAddress}</span>}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn("text-[10px] px-2 py-1 rounded-full font-bold uppercase",
                            isPast ? "bg-slate-200 text-slate-500" : "bg-brand-primary/20 text-brand-primary")}>
                            {isPast ? 'Done' : 'Upcoming'}
                          </span>
                          {!isPast && (
                            <button onClick={() => handleRemoveAssignment(a.id)}
                              className="text-xs text-red-400 hover:text-red-600 font-medium">
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Stats sidebar */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4">
            <h4 className="font-display font-bold text-slate-700">Quick Stats</h4>
            <div className="space-y-3">
              {[
                { label: 'Total Assignments', value: assignments.length },
                { label: 'Upcoming', value: assignments.filter(a => new Date(a.endAt) > new Date()).length },
                { label: 'Completed', value: assignments.filter(a => new Date(a.endAt) <= new Date()).length },
              ].map(stat => (
                <div key={stat.label} className="flex justify-between items-center py-2 border-b border-slate-50">
                  <span className="text-sm text-slate-500">{stat.label}</span>
                  <span className="font-display font-bold text-slate-800">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
