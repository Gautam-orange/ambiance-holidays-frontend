import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, XCircle } from 'lucide-react';

/**
 * Landing page after Peach Payments hosted checkout. Our backend's
 * /payments/peach/return endpoint receives the POST from Peach, updates the
 * payment + booking, then 303-redirects the customer's browser here with:
 *
 *    ?status=success | ?status=failed
 *    &ref=<bookingReference>
 *    &code=<peachResultCode>
 *
 * This page just routes to /payment/success or /payment/failure based on those
 * query params. No further backend call is needed because the result was
 * already persisted server-side.
 */
export default function PaymentReturnPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const status = params.get('status');
    const ref    = params.get('ref');
    const code   = params.get('code');

    if (!status) {
      setError('Missing payment status in return URL.');
      return;
    }

    if (status === 'success' && ref) {
      navigate(`/payment/success?ref=${encodeURIComponent(ref)}`, { replace: true });
    } else {
      const reason = code ?? 'unknown';
      navigate(`/payment/failure?reason=${encodeURIComponent(reason)}${ref ? `&ref=${encodeURIComponent(ref)}` : ''}`,
        { replace: true });
    }
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Confirming payment…</h1>
        <p className="text-gray-500 text-sm">One moment while we redirect you to your booking confirmation.</p>
      </div>
    </div>
  );
}
