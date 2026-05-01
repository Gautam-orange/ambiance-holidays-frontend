import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, XCircle } from 'lucide-react';
import { checkPeachStatus, type PeachStatusResponse } from '../api/bookings';

/**
 * Landing page Peach Payments redirects to after the customer finishes (or
 * abandons) the V2 hosted checkout. Reads ?id=… from the URL, asks the
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

    // Backend's /return redirect sets ?ref=<merchantTransactionId or checkoutId>.
    // Older code paths used ?id= or ?checkoutId= — accept all variants so
    // refreshing or coming from a legacy link still works.
    const ref =
      params.get('ref')
      ?? params.get('id')
      ?? params.get('checkoutId')
      ?? params.get('resourcePath')?.split('/').pop()
      ?? '';

    if (!ref) {
      setError('Missing checkout reference in return URL.');
      return;
    }

    // No `cancelled` flag — `ranRef` already prevents a duplicate API call
    // under React StrictMode's double-mount. Adding a cleanup-cancel on top
    // backfires: the cleanup fires synchronously between the two mounts and
    // suppresses the only navigate call we'd make.
    checkPeachStatus(ref)
      .then((res: PeachStatusResponse) => {
        if (res.success) {
          navigate(`/payment/success?ref=${encodeURIComponent(res.bookingReference)}`, { replace: true });
        } else {
          const reason = res.resultDescription ?? res.resultCode ?? 'unknown';
          navigate(`/payment/failure?reason=${encodeURIComponent(reason)}`, { replace: true });
        }
      })
      .catch((err: any) => {
        setError(
          err?.response?.data?.message
          ?? err?.response?.data?.error?.message
          ?? 'Could not verify payment status.',
        );
      });
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
