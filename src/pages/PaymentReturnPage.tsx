import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, XCircle } from 'lucide-react';
import { checkPeachStatus, type PeachStatusResponse } from '../api/bookings';

/**
 * Landing page Peach Payments redirects to after the user finishes (or abandons)
 * the hosted checkout. Reads ?id=… (or ?checkoutId=…) from the URL, asks the
 * backend to verify the payment with Peach, and routes to /payment/success
 * or /payment/failure.
 */
export default function PaymentReturnPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const checkoutId =
      params.get('checkoutId') ?? params.get('id') ?? params.get('resourcePath')?.split('/').pop() ?? '';

    if (!checkoutId) {
      setError('Missing checkout reference in return URL.');
      return;
    }

    let cancelled = false;
    checkPeachStatus(checkoutId)
      .then((res: PeachStatusResponse) => {
        if (cancelled) return;
        if (res.success) {
          navigate(`/payment/success?ref=${encodeURIComponent(res.bookingReference)}`, { replace: true });
        } else {
          const reason = res.resultDescription ?? res.resultCode ?? 'unknown';
          navigate(`/payment/failure?reason=${encodeURIComponent(reason)}`, { replace: true });
        }
      })
      .catch((err: any) => {
        if (cancelled) return;
        setError(
          err?.response?.data?.message ??
          err?.response?.data?.error?.message ??
          'Could not verify payment status.',
        );
      });

    return () => { cancelled = true; };
  }, [params, navigate]);

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-9 h-9 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h1>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <button
            onClick={() => navigate('/cart')}
            className="bg-brand-primary text-white px-6 py-2.5 rounded-lg font-medium hover:bg-brand-primary/90"
          >
            Back to Cart
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <Loader2 className="w-12 h-12 text-brand-primary animate-spin mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifying payment…</h1>
        <p className="text-gray-500 text-sm">
          Please wait while we confirm your booking with the payment gateway. Do not close this window.
        </p>
      </div>
    </div>
  );
}
