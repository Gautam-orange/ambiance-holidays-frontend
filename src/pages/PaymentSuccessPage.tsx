import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Download, ArrowRight } from 'lucide-react';

export default function PaymentSuccessPage() {
  const [params] = useSearchParams();
  const bookingRef = params.get('ref');

  const downloadInvoice = async () => {
    if (!bookingRef) return;
    const res = await fetch(`/api/v1/bookings/${bookingRef}/invoice`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${bookingRef}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-9 h-9 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
        {bookingRef && (
          <p className="text-gray-500 mb-6">
            Booking reference: <span className="font-mono font-semibold text-gray-800">{bookingRef}</span>
          </p>
        )}
        <p className="text-gray-500 text-sm mb-8">
          A confirmation email has been sent to your registered address. You can download your invoice below.
        </p>
        <div className="space-y-3">
          {bookingRef && (
            <button
              onClick={downloadInvoice}
              className="w-full flex items-center justify-center gap-2 border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Invoice
            </button>
          )}
          <Link
            to="/agent/bookings"
            className="w-full flex items-center justify-center gap-2 bg-brand-primary text-white py-2.5 rounded-lg font-medium hover:bg-brand-primary/90 transition-colors"
          >
            View My Bookings
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
