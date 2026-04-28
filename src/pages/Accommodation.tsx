import React, { useState } from 'react';
import { Mail, Phone, ArrowRight, CheckCircle, Star, Wifi, Utensils, Waves } from 'lucide-react';
import { motion } from 'motion/react';
import apiClient from '../api/client';

const STAY_TYPES = [
  {
    img: '/images/rumman-amin-6iSZzFMKQbs-unsplash.jpg',
    badge: 'Most Popular',
    title: 'Beachfront Resorts',
    sub: '5-star · All-Inclusive',
    desc: 'Wake up to the Indian Ocean lapping at your doorstep. Handpicked 5-star resorts with private beach access, infinity pools and world-class spa facilities.',
    perks: ['Private beach access', 'Infinity pool', 'Spa & wellness', 'Fine dining'],
    from: '',
  },
  {
    img: '/images/rumman-amin-s3o2rkTkF7I-unsplash.jpg',
    badge: 'Romantic',
    title: 'Boutique Villas',
    sub: 'Private · Garden or Sea view',
    desc: 'Intimate retreats nestled in tropical gardens. Perfect for honeymooners and couples seeking seclusion and personalised service.',
    perks: ['Private plunge pool', 'Butler service', 'Breakfast included', 'Tropical garden'],
    from: '',
  },
  {
    img: '/images/pexels-alina-dmytrenko-2151462911-31743357.jpg',
    badge: 'Family',
    title: 'Beach Hotels',
    sub: 'Family-friendly · All Ages',
    desc: 'Spacious rooms, kids clubs and beach access — everything a family needs for a stress-free holiday in Mauritius.',
    perks: ['Kids club', 'Water sports included', 'Family suites', 'Multiple restaurants'],
    from: '',
  },
];

const GALLERY = [
  { img: '/images/pexels-omar-kareem-73327251-8479653.jpg', label: 'Private Beach' },
  { img: '/images/pexels-quang-nguyen-vinh-222549-3355735.jpg', label: 'Beach Loungers' },
  { img: '/images/pexels-asadphoto-3319712.jpg', label: 'Island Paradise' },
  { img: '/images/pexels-umaraffan499-88212.jpg', label: 'Tropical Lagoon' },
];

export default function Accommodation() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '', checkIn: '', checkOut: '', guests: '', type: '' });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await apiClient.post('/public/contact', {
        name: form.name,
        email: form.email,
        phone: form.phone,
        message: `Accommodation Enquiry\nType: ${form.type || 'Any'}\nCheck-in: ${form.checkIn}\nCheck-out: ${form.checkOut}\nGuests: ${form.guests}\n\n${form.message}`,
      });
      setSent(true);
    } catch {
      alert('Failed to send. Please email us directly.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* ── Hero ── */}
      <div className="relative h-[520px] overflow-hidden flex items-end">
        <img src="/images/xavier-coiffic-REz1OCM2fmY-unsplash.jpg" alt="Mauritius Resort" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-900/90 via-brand-900/40 to-transparent" />
        <div className="relative z-10 max-w-7xl mx-auto px-8 pb-16 w-full">
          <span className="inline-block bg-brand-primary/20 border border-brand-primary/40 text-brand-primary font-bold tracking-[0.3em] uppercase text-xs px-4 py-2 rounded-full mb-4">
            Accommodation
          </span>
          <h1 className="text-6xl font-display font-bold text-white leading-tight mb-3">
            Handpicked <span className="text-brand-primary">Stays</span>
          </h1>
          <p className="text-white/60 text-lg max-w-xl">
            We curate only the finest hotels, resorts and villas in Mauritius — tailored to your dates, budget and style.
          </p>
        </div>
      </div>

      {/* ── Gallery strip ── */}
      <div className="max-w-7xl mx-auto px-8 -mt-8 relative z-10 grid grid-cols-4 gap-3 mb-16">
        {GALLERY.map(g => (
          <motion.div key={g.label} whileHover={{ y: -4 }} className="relative rounded-2xl overflow-hidden h-32 group cursor-pointer shadow-lg">
            <img src={g.img} alt={g.label} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />
            <span className="absolute bottom-2 left-3 text-white text-xs font-bold drop-shadow">{g.label}</span>
          </motion.div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-8 pb-20 space-y-16">
        {/* ── Stay types ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STAY_TYPES.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-xl shadow-slate-200/40 group"
            >
              <div className="relative h-52 overflow-hidden">
                <img src={s.img} alt={s.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <span className="absolute top-4 left-4 bg-brand-primary text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  {s.badge}
                </span>
                <div className="absolute bottom-4 left-4 text-white">
                  <p className="font-display font-bold text-xl">{s.title}</p>
                  <p className="text-white/70 text-xs">{s.sub}</p>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {s.perks.map(p => (
                    <span key={p} className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">{p}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">From</p>
                    <p className="font-display font-bold text-brand-primary">{s.from} / night</p>
                  </div>
                  <button
                    onClick={() => document.getElementById('enquiry-form')?.scrollIntoView({ behavior: 'smooth' })}
                    className="bg-brand-primary text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-brand-secondary transition-all">
                    Enquire
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Amenity highlights ── */}
        <div className="bg-brand-primary rounded-3xl p-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-white">
          {[
            { icon: Waves,    label: 'Private Beach', sub: 'Exclusive beach access at select properties' },
            { icon: Star,     label: 'Curated Only',  sub: 'Personally vetted by our Mauritius team' },
            { icon: Wifi,     label: 'Concierge',     sub: '24/7 dedicated concierge support' },
            { icon: Utensils, label: 'Fine Dining',   sub: 'Restaurant recommendations & reservations' },
          ].map(a => (
            <div key={a.label} className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-brand-primary/20 border border-brand-primary/30 flex items-center justify-center">
                <a.icon className="w-6 h-6 text-brand-primary" />
              </div>
              <div>
                <p className="font-bold">{a.label}</p>
                <p className="text-white/50 text-xs mt-0.5 leading-relaxed">{a.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Enquiry Form ── */}
        <div id="enquiry-form" className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="relative h-40 overflow-hidden">
            <img src="/images/pexels-asadphoto-3320533.jpg" alt="Beach" className="w-full h-full object-cover object-center" />
            <div className="absolute inset-0 bg-brand-primary/70" />
            <div className="absolute inset-0 flex items-center px-10">
              <div>
                <h2 className="text-3xl font-display font-bold text-white">Request Your Stay</h2>
                <p className="text-white/60 text-sm mt-1">We'll send you personally curated options within 24 hours.</p>
              </div>
            </div>
          </div>

          <div className="p-10">
            {sent ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-xl font-display font-bold text-slate-800 mb-2">Enquiry Sent!</h3>
                <p className="text-slate-500">Our team will come back to you within 24 hours with handpicked options.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Full Name *</label>
                    <input name="name" value={form.name} onChange={handleChange} required
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-brand-primary/20" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Email *</label>
                    <input name="email" type="email" value={form.email} onChange={handleChange} required
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-brand-primary/20" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Phone</label>
                    <input name="phone" value={form.phone} onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-brand-primary/20" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Stay Type</label>
                    <select name="type" value={form.type} onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-brand-primary/20 bg-white">
                      <option value="">Any type</option>
                      <option value="Beachfront Resort">Beachfront Resort</option>
                      <option value="Boutique Villa">Boutique Villa</option>
                      <option value="Beach Hotel">Beach Hotel</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Check-in</label>
                    <input name="checkIn" type="date" value={form.checkIn} onChange={handleChange}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-brand-primary/20" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Check-out</label>
                    <input name="checkOut" type="date" value={form.checkOut} onChange={handleChange}
                      min={form.checkIn || new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-brand-primary/20" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Guests</label>
                    <input name="guests" value={form.guests} onChange={handleChange} placeholder="e.g. 2 Adults, 1 Child"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-brand-primary/20" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Budget / Special Requests</label>
                    <input name="message" value={form.message} onChange={handleChange} placeholder="Budget range, view preference..."
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-brand-primary/20" />
                  </div>
                </div>
                <button type="submit" disabled={sending}
                  className="w-full bg-brand-primary text-white py-3.5 rounded-xl font-bold hover:bg-brand-secondary transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                  {sending ? 'Sending…' : <><ArrowRight className="w-4 h-4" /> Send Enquiry</>}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* ── Direct contact ── */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="mailto:info@ambianceholidays.mu"
            className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-6 py-4 hover:border-brand-primary hover:shadow-md transition-all group">
            <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center group-hover:bg-brand-primary transition-colors">
              <Mail className="w-5 h-5 text-brand-primary group-hover:text-white transition-colors" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Email Us</p>
              <p className="font-bold text-slate-800">info@ambianceholidays.mu</p>
            </div>
          </a>
          <a href="tel:+23052850500"
            className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-6 py-4 hover:border-brand-primary hover:shadow-md transition-all group">
            <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center group-hover:bg-brand-primary transition-colors">
              <Phone className="w-5 h-5 text-brand-primary group-hover:text-white transition-colors" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Call Us</p>
              <p className="font-bold text-slate-800">+230 5285 0500</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
