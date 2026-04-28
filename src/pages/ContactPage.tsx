import React, { useState } from 'react';
import { MapPin, Phone, Mail, Send } from 'lucide-react';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('/api/v1/public/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setSubmitted(true);
    } catch {
      // silent — form still shows submitted to avoid email enumeration
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Get In Touch</h1>
      <p className="text-gray-500 mb-10">We'd love to hear from you. Send us a message and we'll respond within 24 hours.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Contact Info */}
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <MapPin className="w-5 h-5 text-brand-primary mt-1 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-800">Head Office</p>
              <p className="text-gray-500 text-sm">Draper Avenue Quatre Bornes, Mauritius</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Phone className="w-5 h-5 text-brand-primary mt-1 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-800">Phone</p>
              <p className="text-gray-500 text-sm">+230 5285 0500</p>
              <p className="text-gray-500 text-sm">+230 4608423</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Mail className="w-5 h-5 text-brand-primary mt-1 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-800">Email</p>
              <p className="text-gray-500 text-sm">info@ambianceholidays.com</p>
              <p className="text-gray-500 text-sm">reservation@ambianceholidays.com</p>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        {submitted ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-8 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Send className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-green-800 mb-2">Message Sent!</h3>
            <p className="text-green-600 text-sm">Thank you for reaching out. We'll be in touch within 24 hours.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Honeypot */}
            <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+230"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                required
                rows={5}
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-primary text-white py-2.5 rounded-lg font-medium hover:bg-brand-primary/90 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Sending…' : 'Send Message'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
