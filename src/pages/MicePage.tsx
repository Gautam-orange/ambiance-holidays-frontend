import React from 'react';

export default function MicePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">MICE</h1>
      <p className="text-gray-600 text-lg mb-2">Meetings · Incentives · Conferences · Exhibitions</p>
      <p className="text-gray-600 mb-8">
        Host world-class corporate events in Mauritius. Our MICE specialists will tailor every detail.
      </p>
      <a href="/contact" className="inline-block bg-brand-primary text-white px-8 py-3 rounded-lg font-medium hover:bg-brand-primary/90 transition-colors">
        Request a Proposal
      </a>
    </div>
  );
}
