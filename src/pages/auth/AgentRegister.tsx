import React, { useState } from 'react';
import { User, Mail, Building, Globe, MapPin, Lock, ChevronRight, CheckCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import authApi, { SignupRequest } from '../../api/auth';
import LoadingSpinner from '../../components/LoadingSpinner';

type BusinessType = 'TRAVEL_AGENCY' | 'FREELANCER' | 'CORPORATE';

const BUSINESS_TYPES: { label: string; value: BusinessType }[] = [
  { label: 'Travel Agency', value: 'TRAVEL_AGENCY' },
  { label: 'Freelancer', value: 'FREELANCER' },
  { label: 'Corporate', value: 'CORPORATE' },
];

export default function AgentRegister() {
  const [form, setForm] = useState<Partial<SignupRequest>>({ businessType: 'TRAVEL_AGENCY' });
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const set = (field: keyof SignupRequest) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await authApi.signup(form as SignupRequest);
      setSuccess(true);
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message ?? 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-8">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-12 text-center space-y-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-display font-bold text-brand-primary">Application Submitted!</h2>
          <p className="text-slate-500 font-medium leading-relaxed">
            Thank you for registering. Your account is pending admin review.
            You'll receive an email once approved.
          </p>
          <Link to="/auth/login" className="block w-full bg-brand-primary text-white py-4 rounded-2xl font-bold text-center hover:bg-brand-secondary transition-all">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left sidebar */}
      <div className="hidden lg:flex w-1/3 bg-brand-primary p-20 flex-col justify-between overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary opacity-10 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
        <div className="relative z-10 space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center font-bold text-white text-xl">AH</div>
            <h1 className="font-display font-bold text-2xl text-white">Ambiance</h1>
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-display font-bold text-white leading-tight">
              Partner with the best in <span className="text-brand-primary">Mauritius</span>
            </h2>
            <p className="text-white/40 font-medium leading-relaxed">
              Join our B2B network and unlock premium access to car rentals, luxury transfers, and curated excursions.
            </p>
          </div>
        </div>

        <div className="relative z-10 p-8 bg-white/5 rounded-3xl border border-white/10 space-y-6">
          <h3 className="text-xs uppercase font-bold text-brand-primary tracking-widest">Partner Benefits</h3>
          <div className="space-y-4 text-sm font-medium text-white/80">
            {['Competitive Commission Rates', 'Real-time Availability & Booking', '24/7 Dedicated Partner Support'].map(b => (
              <div key={b} className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <ChevronRight className="w-3 h-3 text-white" />
                </div>
                <span>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-20 overflow-y-auto">
        <div className="max-w-2xl w-full space-y-12">
          <div className="space-y-2">
            <h3 className="text-3xl font-display font-bold text-brand-primary">Partner Registration</h3>
            <p className="text-slate-500 font-medium">Please enter your business details for account review.</p>
          </div>

          <form className="space-y-10" onSubmit={handleSubmit}>
            {error && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-sm text-red-600 font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">First Name *</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" placeholder="John" required onChange={set('firstName')}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary/20 text-sm font-medium" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Last Name *</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" placeholder="Doe" required onChange={set('lastName')}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary/20 text-sm font-medium" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="email" placeholder="john@company.com" required onChange={set('email')}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary/20 text-sm font-medium" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="password" placeholder="Min 8 chars, upper, lower, digit, symbol" required onChange={set('password')}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary/20 text-sm font-medium" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Company Name *</label>
                <div className="relative">
                  <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" placeholder="Travel Co. Ltd" required onChange={set('companyName')}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary/20 text-sm font-medium" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Country *</label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" placeholder="Mauritius" required onChange={set('country')}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary/20 text-sm font-medium" />
                </div>
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Complete Address</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" placeholder="Street, Building, Floor" onChange={set('address')}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary/20 text-sm font-medium" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Business Type *</label>
              <div className="grid grid-cols-3 gap-4">
                {BUSINESS_TYPES.map(({ label, value }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, businessType: value }))}
                    className={`py-4 border rounded-2xl text-xs font-bold transition-all bg-white ${
                      form.businessType === value
                        ? 'border-brand-primary text-brand-primary bg-brand-primary/5 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:border-brand-primary hover:text-brand-primary'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex flex-col items-center gap-6">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-brand-primary text-white py-5 rounded-3xl font-bold hover:bg-brand-primary/90 shadow-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? <LoadingSpinner size="sm" /> : 'Send For Admin Approval'}
              </button>
              <p className="text-sm font-medium text-slate-500">
                Already an Agent?{' '}
                <Link to="/auth/login" className="text-brand-primary font-bold hover:underline">Login</Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
