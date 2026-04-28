import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle, RotateCcw } from 'lucide-react';

export default function PaymentFailurePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-9 h-9 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
        <p className="text-gray-500 text-sm mb-8">
          Your payment could not be processed. Your cart items are still saved — please try again or use a different payment method.
        </p>
        <div className="space-y-3">
          <button
            onClick={() => navigate('/checkout')}
            className="w-full flex items-center justify-center gap-2 bg-brand-primary text-white py-2.5 rounded-lg font-medium hover:bg-brand-primary/90 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </button>
          <button
            onClick={() => navigate('/cart')}
            className="w-full border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Back to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
