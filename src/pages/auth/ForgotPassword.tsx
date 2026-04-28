import React, { useState } from 'react';
import { Mail, ArrowLeft, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import authApi from '../../api/auth';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 items-center justify-center p-8">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        <div className="bg-brand-primary p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
          <Link to="/auth/login" className="inline-flex items-center gap-2 text-xs font-bold text-white/60 hover:text-white transition-colors mb-6 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Login
          </Link>
          <h3 className="text-3xl font-display font-bold">Forgot Password?</h3>
          <p className="text-white/60 text-sm mt-2 font-medium">No worries, we'll send you reset instructions.</p>
        </div>

        <div className="p-10">
          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {error && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-sm text-red-600 font-medium">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Email Address</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-brand-primary transition-colors" />
                      <input
                        type="email"
                        placeholder="agent@company.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-sm font-medium transition-all"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-brand-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-brand-secondary transition-all shadow-xl shadow-brand-primary/20 group disabled:opacity-60"
                  >
                    {isLoading ? <LoadingSpinner size="sm" /> : (
                      <>Send Reset Link <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /></>
                    )}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6 py-4"
              >
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto border border-green-100">
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-xl font-display font-bold text-slate-900">Check your email</h4>
                  <p className="text-slate-500 text-sm leading-relaxed max-w-[280px] mx-auto">
                    If an account exists for <span className="font-bold text-slate-900">{email}</span>, you'll receive reset instructions shortly.
                  </p>
                </div>
                <button onClick={() => setSubmitted(false)} className="text-sm font-bold text-brand-primary hover:underline">
                  Didn't receive email? Try again
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Secure Authentication System</p>
        </div>
      </div>
    </div>
  );
}
