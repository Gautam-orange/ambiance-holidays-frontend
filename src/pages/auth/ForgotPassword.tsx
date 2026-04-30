import React, { useEffect, useRef, useState } from 'react';
import { Mail, ArrowLeft, Send, CheckCircle2, AlertCircle, ShieldCheck, KeyRound, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import authApi from '../../api/auth';
import LoadingSpinner from '../../components/LoadingSpinner';

type Step = 'email' | 'otp' | 'password' | 'success';

const RESEND_COOLDOWN_SECONDS = 60;
const OTP_LENGTH = 6;
const PASSWORD_RULE_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

/**
 * Three-step OTP password reset:
 *   1. Email      — user enters their email; backend emails a 6-digit OTP
 *   2. OTP        — user enters the 6 digits; backend returns a short-lived JWT
 *   3. Password   — user sets the new password; backend validates JWT + persists
 *   4. Success    — confirmation, link to login
 *
 * State is local to this component so navigating away cancels the flow.
 */
export default function ForgotPassword() {
  const navigate = useNavigate();

  // ── shared state ───────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // ── step 2 ─────────────────────────────────────────────────────────────
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  // ── step 3 ─────────────────────────────────────────────────────────────
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // ── helpers ───────────────────────────────────────────────────────────
  const otpValue = otpDigits.join('');

  const handleOtpChange = (i: number, raw: string) => {
    // Allow paste of multiple digits into any box.
    const digits = raw.replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (digits.length > 1) {
      const next = Array(OTP_LENGTH).fill('');
      for (let j = 0; j < digits.length; j++) next[j] = digits[j];
      setOtpDigits(next);
      const focusIdx = Math.min(digits.length, OTP_LENGTH - 1);
      otpRefs.current[focusIdx]?.focus();
      return;
    }
    const next = [...otpDigits];
    next[i] = digits;
    setOtpDigits(next);
    if (digits && i < OTP_LENGTH - 1) otpRefs.current[i + 1]?.focus();
  };

  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[i] && i > 0) {
      otpRefs.current[i - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && i > 0) {
      otpRefs.current[i - 1]?.focus();
    } else if (e.key === 'ArrowRight' && i < OTP_LENGTH - 1) {
      otpRefs.current[i + 1]?.focus();
    }
  };

  // ── step 1: email submit ──────────────────────────────────────────────
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setIsLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      setStep('otp');
      setOtpDigits(Array(OTP_LENGTH).fill(''));
      setResendIn(RESEND_COOLDOWN_SECONDS);
      setInfo(`We've sent a 6-digit code to ${email.trim()}. It expires in 10 minutes.`);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? 'Could not send code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── step 2: OTP submit ────────────────────────────────────────────────
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpValue.length !== OTP_LENGTH) {
      setError('Please enter all 6 digits.');
      return;
    }
    setError('');
    setInfo('');
    setIsLoading(true);
    try {
      const res = await authApi.verifyOtp(email.trim(), otpValue);
      setVerificationToken(res.verificationToken);
      setStep('password');
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? 'Invalid or expired code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendIn > 0) return;
    setError('');
    setInfo('');
    setIsLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      setOtpDigits(Array(OTP_LENGTH).fill(''));
      setResendIn(RESEND_COOLDOWN_SECONDS);
      setInfo(`A new 6-digit code has been sent to ${email.trim()}.`);
      otpRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? 'Could not resend code.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── step 3: new password submit ───────────────────────────────────────
  const passwordRulesOk = PASSWORD_RULE_RE.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordRulesOk) {
      setError('Password must be at least 8 characters and include upper, lower, digit and special character.');
      return;
    }
    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await authApi.resetPassword(email.trim(), verificationToken, newPassword);
      setStep('success');
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? 'Could not reset password. Please restart the process.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── header copy per step ───────────────────────────────────────────────
  const headerCopy: Record<Step, { title: string; subtitle: string }> = {
    email:    { title: 'Forgot Password?',     subtitle: "We'll email you a 6-digit code to reset your password." },
    otp:      { title: 'Enter the Code',       subtitle: 'Check your inbox for the 6-digit verification code.' },
    password: { title: 'Set a New Password',   subtitle: 'Choose a strong password to secure your account.' },
    success:  { title: 'Password Updated',     subtitle: 'You can now sign in with your new password.' },
  };

  return (
    <div className="min-h-screen flex bg-slate-50 items-center justify-center p-8">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-brand-primary p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
          {step !== 'success' && (
            <Link to="/auth/login" className="inline-flex items-center gap-2 text-xs font-bold text-white/60 hover:text-white transition-colors mb-6 group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Login
            </Link>
          )}
          <h3 className="text-3xl font-display font-bold">{headerCopy[step].title}</h3>
          <p className="text-white/60 text-sm mt-2 font-medium">{headerCopy[step].subtitle}</p>

          {/* Step indicator */}
          {step !== 'success' && (
            <div className="flex items-center gap-1.5 mt-5">
              {(['email', 'otp', 'password'] as Step[]).map((s, i) => {
                const stepIdx = ['email','otp','password'].indexOf(step);
                return (
                  <div
                    key={s}
                    className={`h-1.5 rounded-full transition-all ${
                      s === step ? 'bg-white w-8' : (stepIdx > i ? 'bg-white/80 w-6' : 'bg-white/30 w-6')
                    }`}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-10">
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-sm text-red-600 font-medium mb-5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {info && !error && (
            <div className="flex items-start gap-2 bg-brand-primary/10 border border-brand-primary/20 rounded-xl px-3 py-2 text-xs text-brand-primary font-medium mb-5">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{info}</span>
            </div>
          )}

          <AnimatePresence mode="wait">
            {step === 'email' && (
              <motion.form
                key="email"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleEmailSubmit}
                className="space-y-6"
              >
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
                      autoFocus
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-sm font-medium transition-all"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !email.trim()}
                  className="w-full bg-brand-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-brand-secondary transition-all shadow-xl shadow-brand-primary/20 group disabled:opacity-60"
                >
                  {isLoading ? <LoadingSpinner size="sm" /> : (
                    <>Send Verification Code <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /></>
                  )}
                </button>
              </motion.form>
            )}

            {step === 'otp' && (
              <motion.form
                key="otp"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleOtpSubmit}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Verification Code</label>
                  <div className="flex justify-between gap-2">
                    {otpDigits.map((d, i) => (
                      <input
                        key={i}
                        ref={el => { otpRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        autoComplete={i === 0 ? 'one-time-code' : 'off'}
                        maxLength={OTP_LENGTH}
                        value={d}
                        onChange={e => handleOtpChange(i, e.target.value)}
                        onKeyDown={e => handleOtpKeyDown(i, e)}
                        className="w-12 h-14 text-center text-xl font-display font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                      />
                    ))}
                  </div>
                </div>

                <div className="text-xs text-slate-500 text-center">
                  Didn't receive it?{' '}
                  {resendIn > 0 ? (
                    <span className="text-slate-400">Resend in {resendIn}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={isLoading}
                      className="text-brand-primary font-bold hover:underline"
                    >
                      Resend code
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || otpValue.length !== OTP_LENGTH}
                  className="w-full bg-brand-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-brand-secondary transition-all shadow-xl shadow-brand-primary/20 disabled:opacity-60"
                >
                  {isLoading ? <LoadingSpinner size="sm" /> : (
                    <>Verify Code <ShieldCheck className="w-4 h-4" /></>
                  )}
                </button>
              </motion.form>
            )}

            {step === 'password' && (
              <motion.form
                key="password"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handlePasswordSubmit}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">New Password</label>
                  <div className="relative">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      required
                      autoFocus
                      className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-sm font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(s => !s)}
                      tabIndex={-1}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Confirm Password</label>
                  <div className="relative">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-sm font-medium"
                    />
                  </div>
                </div>

                <ul className="text-xs text-slate-500 space-y-1 pl-1">
                  <li className={passwordRulesOk ? 'text-green-600' : ''}>
                    {passwordRulesOk ? '✓' : '•'} 8+ chars with upper, lower, digit, special character
                  </li>
                  <li className={confirmPassword ? (passwordsMatch ? 'text-green-600' : 'text-red-500') : ''}>
                    {confirmPassword ? (passwordsMatch ? '✓' : '✗') : '•'} Passwords match
                  </li>
                </ul>

                <button
                  type="submit"
                  disabled={isLoading || !passwordRulesOk || !passwordsMatch}
                  className="w-full bg-brand-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-brand-secondary transition-all shadow-xl shadow-brand-primary/20 disabled:opacity-60"
                >
                  {isLoading ? <LoadingSpinner size="sm" /> : (
                    <>Update Password <CheckCircle2 className="w-4 h-4" /></>
                  )}
                </button>
              </motion.form>
            )}

            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6"
              >
                <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-sm text-slate-600">
                  Your password has been updated successfully.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/auth/login')}
                  className="w-full bg-brand-primary text-white py-4 rounded-2xl font-bold hover:bg-brand-secondary transition-all shadow-xl shadow-brand-primary/20"
                >
                  Back to Sign In
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
