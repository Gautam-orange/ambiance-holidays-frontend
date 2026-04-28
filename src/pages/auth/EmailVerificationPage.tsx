import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';

export default function EmailVerificationPage() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading');
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (!token) { setState('error'); return; }
    fetch('/api/v1/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(res => setState(res.ok ? 'success' : 'error'))
      .catch(() => setState('error'));
  }, [token]);

  const resendVerification = async () => {
    const email = prompt('Enter your registered email address:');
    if (!email) return;
    await fetch('/api/v1/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    setResent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        {state === 'loading' && (
          <>
            <Loader2 className="w-10 h-10 text-brand-primary animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Verifying your email…</p>
          </>
        )}
        {state === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-9 h-9 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h1>
            <p className="text-gray-500 text-sm mb-6">
              Your email has been confirmed. Your account is now pending admin approval — we'll notify you by email once approved.
            </p>
            <Link
              to="/auth/login"
              className="inline-block bg-brand-primary text-white px-6 py-2.5 rounded-lg font-medium hover:bg-brand-primary/90 transition-colors"
            >
              Go to Login
            </Link>
          </>
        )}
        {state === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-9 h-9 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Link Expired</h1>
            <p className="text-gray-500 text-sm mb-6">
              This verification link has expired or has already been used.
            </p>
            {resent ? (
              <p className="text-green-600 text-sm font-medium">A new verification email has been sent.</p>
            ) : (
              <button
                onClick={resendVerification}
                className="inline-flex items-center gap-2 bg-brand-primary text-white px-6 py-2.5 rounded-lg font-medium hover:bg-brand-primary/90 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Resend Verification Email
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
