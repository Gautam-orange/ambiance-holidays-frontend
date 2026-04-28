import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function NewsletterConfirm() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!token) { setState('error'); return; }
    fetch(`/api/v1/public/newsletter/confirm/${token}`, { method: 'POST' })
      .then(res => setState(res.ok ? 'success' : 'error'))
      .catch(() => setState('error'));
  }, [token]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        {state === 'loading' && (
          <>
            <Loader2 className="w-10 h-10 text-brand-primary animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Confirming your subscription…</p>
          </>
        )}
        {state === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-9 h-9 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Subscribed!</h1>
            <p className="text-gray-500 text-sm mb-6">You're now subscribed to Ambiance Holidays news and offers.</p>
            <Link to="/" className="inline-block bg-brand-primary text-white px-6 py-2.5 rounded-lg font-medium hover:bg-brand-primary/90 transition-colors">
              Back to Home
            </Link>
          </>
        )}
        {state === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-9 h-9 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Link Invalid</h1>
            <p className="text-gray-500 text-sm mb-6">This confirmation link has expired or is invalid. Please subscribe again.</p>
            <Link to="/" className="inline-block border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors">
              Back to Home
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
