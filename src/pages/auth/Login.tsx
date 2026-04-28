import React, { useState } from 'react';
import { Lock, Mail, ChevronRight, ShieldCheck, Globe, AlertCircle } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function Login() {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login({ email, password });
      const storedUser = JSON.parse(localStorage.getItem('user') ?? '{}');
      const role: string = storedUser.role ?? '';
      const defaultDest = role === 'B2B_AGENT' ? '/agent/bookings' : '/admin';
      navigate(from ?? defaultDest, { replace: true });
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message ?? 'Invalid email or password';
      setError(msg);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left side: Branding */}
      <div className="hidden lg:flex w-1/2 bg-brand-primary relative items-center justify-center p-20 overflow-hidden">
        <div className="absolute inset-0 bg-brand-primary/10 mix-blend-overlay"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-primary/20 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-primary/20 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2"></div>

        <div className="relative z-10 max-w-lg space-y-12">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-brand-primary rounded-xl flex items-center justify-center font-bold text-white text-2xl">AH</div>
            <h1 className="font-display font-bold text-4xl text-white tracking-tight">Ambiance Holidays</h1>
          </div>
          <div className="space-y-6">
            <h2 className="text-5xl font-display font-bold text-white leading-tight">
              Your Travel Partner in <span className="text-brand-primary italic">Mauritius</span>
            </h2>
            <p className="text-white/60 text-lg leading-relaxed font-medium">
              From nature walks to city tours, luxury rentals to family fun, Ambiance Holidays creates a smooth travel experience.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="flex -space-x-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-12 h-12 rounded-full border-2 border-brand-900 bg-slate-200 overflow-hidden">
                  <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="user" />
                </div>
              ))}
            </div>
            <div className="flex flex-col justify-center">
              <p className="text-sm font-bold text-white">Join 2,500+ professionals</p>
              <p className="text-xs text-white/40 uppercase font-bold tracking-widest">Global Partner Network</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-20">
        <div className="max-w-md w-full space-y-12">
          <div className="space-y-4">
            <h3 className="text-4xl font-display font-bold text-brand-primary">Welcome Back!</h3>
            <p className="text-slate-500 font-medium tracking-tight">Please enter your credentials to access your dashboard.</p>
          </div>

          <form className="space-y-8" onSubmit={handleSubmit}>
            {error && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-sm text-red-600 font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-brand-primary transition-colors" />
                  <input
                    type="email"
                    placeholder="Enter email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-sm font-medium transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between px-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Password</label>
                  <Link to="/auth/forgot-password" className="text-xs font-bold text-brand-primary hover:underline">Forgot password?</Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-brand-primary transition-colors" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-sm font-medium transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-brand-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-brand-secondary transition-all shadow-xl shadow-brand-primary/20 group disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    Login to Dashboard
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                <div className="relative flex justify-center text-xs uppercase font-bold text-slate-400 tracking-widest"><span className="bg-slate-50 px-4">Our Commitment</span></div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="flex items-center gap-2 text-slate-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Secure Access</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400 justify-end">
                  <Globe className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Global Reach</span>
                </div>
              </div>
            </div>
          </form>

          <p className="text-center text-slate-500 font-medium">
            Don't have an account?{' '}
            <Link to="/auth/agent-register" className="text-brand-primary font-bold hover:underline">Register as Partner</Link>
          </p>

          <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] pt-8">
            © Copyright 2025 Ambiance Holidays.
          </p>
        </div>
      </div>
    </div>
  );
}
