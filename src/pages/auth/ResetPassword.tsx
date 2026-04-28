import React, { useState } from 'react';
import { Lock, ArrowLeft, CheckCircle2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import authApi from '../../api/auth';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setIsLoading(true);
    try {
      await authApi.resetPassword(token, newPassword);
      setCompleted(true);
      setTimeout(() => navigate('/auth/login'), 2500);
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message ?? 'Reset failed. The link may have expired.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 items-center justify-center p-8">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        <div className="bg-brand-primary p-8 text-white relative overflow-hidden">
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-primary/20 blur-3xl rounded-full -translate-x-1/2 translate-y-1/2"></div>
          <Link to="/auth/login" className="inline-flex items-center gap-2 text-xs font-bold text-white/60 hover:text-white transition-colors mb-6 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Login
          </Link>
          <h3 className="text-3xl font-display font-bold">Set New Password</h3>
          <p className="text-white/60 text-sm mt-2 font-medium">Your new password must be different from previous passwords.</p>
        </div>

        <div className="p-10">
          {!completed ? (
            <form onSubmit={handleReset} className="space-y-8">
              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-sm text-red-600 font-medium">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {!token && (
                <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 font-medium">
                  No reset token found. Please use the link from your email.
                </div>
              )}

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">New Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-brand-primary transition-colors" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      required
                      className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-sm font-medium transition-all"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-primary transition-colors">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Confirm Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-brand-primary transition-colors" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      required
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-sm font-medium transition-all"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !token}
                className="w-full bg-brand-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-brand-secondary transition-all shadow-xl shadow-brand-primary/20 disabled:opacity-60"
              >
                {isLoading ? <LoadingSpinner size="sm" /> : 'Reset Password'}
              </button>
            </form>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6 py-4"
            >
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto border border-green-100">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <div className="space-y-2">
                <h4 className="text-xl font-display font-bold text-slate-900">Password reset successfully</h4>
                <p className="text-slate-500 text-sm leading-relaxed">Redirecting you to the login page...</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
