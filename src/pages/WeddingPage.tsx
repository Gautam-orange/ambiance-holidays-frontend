import React from 'react';

export default function WeddingPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Wedding & Events</h1>
      <p className="text-gray-600 text-lg mb-8">
        Create unforgettable moments in paradise. Contact us to plan your perfect Mauritius wedding.
      </p>
      <a href="/contact" className="inline-block bg-brand-primary text-white px-8 py-3 rounded-lg font-medium hover:bg-brand-primary/90 transition-colors">
        Enquire Now
      </a>
    </div>
  );
}
