import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Car, ArrowRight, Star, Shield, Clock, Headphones, Users, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { catalogTours, type Tour } from '../api/tours';
import PlacesAutocomplete from '../components/PlacesAutocomplete';

const ADULT_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function Home() {
  const [activeTab, setActiveTab] = useState<'Car Rental' | 'Transfer'>('Car Rental');
  const [featuredTours, setFeaturedTours] = useState<Tour[]>([]);
  const navigate = useNavigate();

  // Car Rental fields
  const [crPickup, setCrPickup] = useState('');
  const [crDropoff, setCrDropoff] = useState('');
  const [crAdults, setCrAdults] = useState(2);
  const [crDate, setCrDate] = useState('');
  const [crTime, setCrTime] = useState('');

  // Transfer fields
  const [trTripType, setTrTripType] = useState<'ONE_WAY' | 'ROUND_TRIP'>('ONE_WAY');
  const [trFrom, setTrFrom] = useState('');
  const [trTo, setTrTo] = useState('');
  const [trAdults, setTrAdults] = useState(2);
  const [trDate, setTrDate] = useState('');
  const [trTime, setTrTime] = useState('');

  useEffect(() => {
    catalogTours({ size: 3 })
      .then(r => setFeaturedTours(r.data.slice(0, 3)))
      .catch(() => {});
  }, []);

  const handleSearch = () => {
    if (activeTab === 'Car Rental') {
      const p = new URLSearchParams();
      if (crPickup) p.set('from', crPickup);
      if (crDropoff) p.set('to', crDropoff);
      if (crAdults) p.set('adults', String(crAdults));
      if (crDate) p.set('date', crDate);
      navigate(`/car-rental${p.toString() ? '?' + p : ''}`);
    } else {
      const p = new URLSearchParams();
      if (trFrom) p.set('from', trFrom);
      if (trTo) p.set('to', trTo);
      if (trAdults) p.set('adults', String(trAdults));
      if (trDate) p.set('date', trDate);
      p.set('tripType', trTripType);
      navigate(`/transfers${p.toString() ? '?' + p : ''}`);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="relative">
      {/* ── Hero ── */}
      <section className="min-h-[680px] relative overflow-hidden flex items-center">
        <div className="absolute inset-0">
          <img
            src="/images/xavier-coiffic-ByAHlRiTQjo-unsplash.jpg"
            alt="Discover Mauritius"
            className="w-full h-full object-cover scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-900/85 via-brand-900/60 to-brand-900/20" />
        </div>

        <div className="max-w-7xl mx-auto px-8 w-full relative z-10 py-20">
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} className="max-w-2xl text-white mb-12">
            <h1 className="text-6xl font-display font-bold leading-tight mb-4">
              Discover Mauritius.
            </h1>
            <p className="text-lg text-white/70 max-w-lg leading-relaxed">
              Tailored escapes. Timeless memories.
            </p>
          </motion.div>

          {/* Search Widget */}
          <motion.div
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}
            className="max-w-4xl"
          >
            <div className="bg-white/10 backdrop-blur-md rounded-3xl overflow-hidden border border-white/20 shadow-2xl">
              {/* Tabs */}
              <div className="flex">
                {(['Car Rental', 'Transfer'] as const).map(tab => {
                  const Icon = tab === 'Car Rental' ? Car : MapPin;
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        'flex items-center gap-2.5 px-8 py-4 text-sm font-bold transition-all flex-1 justify-center relative',
                        activeTab === tab
                          ? 'bg-brand-primary text-white'
                          : 'text-white/70 hover:text-white hover:bg-white/10'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {tab}
                    </button>
                  );
                })}
              </div>

              <div className="bg-white p-6 rounded-b-3xl">
                {activeTab === 'Car Rental' ? (
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    {/* Pickup Location */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-brand-primary" /> Pickup Location
                      </label>
                      <div className="flex items-center p-2 bg-slate-50 rounded-xl border border-slate-100">
                        <PlacesAutocomplete
                          value={crPickup}
                          onChange={setCrPickup}
                          placeholder="Where from"
                          className="bg-transparent border-none outline-none text-xs font-medium w-full pl-6"
                          showIcon
                        />
                      </div>
                    </div>
                    {/* Adults */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                        <Users className="w-3 h-3 text-brand-primary" /> Adult Count
                      </label>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <select
                          value={crAdults}
                          onChange={e => setCrAdults(Number(e.target.value))}
                          className="bg-transparent border-none outline-none text-xs font-medium w-full text-slate-700"
                        >
                          {ADULT_OPTIONS.map(n => <option key={n} value={n}>{n} Adult{n > 1 ? 's' : ''}</option>)}
                        </select>
                      </div>
                    </div>
                    {/* Date */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Pickup Date</label>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <input
                          type="date"
                          value={crDate}
                          min={today}
                          onChange={e => setCrDate(e.target.value)}
                          className="bg-transparent border-none outline-none text-xs font-medium w-full text-slate-700"
                        />
                      </div>
                    </div>
                    {/* Time */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Pickup Time</label>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <input
                          type="time"
                          value={crTime}
                          onChange={e => setCrTime(e.target.value)}
                          className="bg-transparent border-none outline-none text-xs font-medium w-full text-slate-700"
                        />
                      </div>
                    </div>
                    {/* Search */}
                    <button
                      onClick={handleSearch}
                      className="bg-brand-primary text-white h-[46px] rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-brand-secondary transition-all shadow-lg shadow-brand-primary/20"
                    >
                      <Search className="w-4 h-4" /> Search
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Trip type */}
                    <div className="flex items-center gap-6">
                      {(['ONE_WAY', 'ROUND_TRIP'] as const).map(t => (
                        <label key={t} className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-600">
                          <input
                            type="radio"
                            name="tripType"
                            value={t}
                            checked={trTripType === t}
                            onChange={() => setTrTripType(t)}
                            className="accent-brand-primary w-4 h-4"
                          />
                          {t === 'ONE_WAY' ? 'One Way' : 'Round Trip'}
                        </label>
                      ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                      {/* From */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-brand-primary" /> From Location
                        </label>
                        <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                          <PlacesAutocomplete
                            value={trFrom}
                            onChange={setTrFrom}
                            placeholder="Where from"
                            className="bg-transparent border-none outline-none text-xs font-medium w-full pl-6"
                            showIcon
                          />
                        </div>
                      </div>
                      {/* To */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-brand-primary" /> To Location
                        </label>
                        <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                          <PlacesAutocomplete
                            value={trTo}
                            onChange={setTrTo}
                            placeholder="Where to"
                            className="bg-transparent border-none outline-none text-xs font-medium w-full pl-6"
                            showIcon
                          />
                        </div>
                      </div>
                      {/* Adults */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                          <Users className="w-3 h-3 text-brand-primary" /> Adult Count
                        </label>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <select
                            value={trAdults}
                            onChange={e => setTrAdults(Number(e.target.value))}
                            className="bg-transparent border-none outline-none text-xs font-medium w-full text-slate-700"
                          >
                            {ADULT_OPTIONS.map(n => <option key={n} value={n}>{n} Adult{n > 1 ? 's' : ''}</option>)}
                          </select>
                        </div>
                      </div>
                      {/* Date */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Date & Time</label>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <input
                            type="date"
                            value={trDate}
                            min={today}
                            onChange={e => setTrDate(e.target.value)}
                            className="bg-transparent border-none outline-none text-xs font-medium w-full text-slate-700"
                          />
                        </div>
                      </div>
                      {/* Search */}
                      <button
                        onClick={handleSearch}
                        className="bg-brand-primary text-white h-[46px] rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-brand-secondary transition-all shadow-lg shadow-brand-primary/20"
                      >
                        <Search className="w-4 h-4" /> Search
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="absolute bottom-8 right-8 z-10 hidden xl:flex gap-3">
          {[
            { icon: Star, label: '4.9 Rating', sub: '2,400+ reviews' },
            { icon: Shield, label: 'Fully Licensed', sub: 'Mauritius Tourism' },
          ].map(b => (
            <div key={b.label} className="bg-white/10 backdrop-blur-md border border-white/20 px-5 py-3 rounded-2xl text-white flex items-center gap-3">
              <b.icon className="w-5 h-5 text-brand-primary" />
              <div>
                <p className="font-bold text-sm leading-tight">{b.label}</p>
                <p className="text-white/60 text-xs">{b.sub}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── Why Choose Us ── */}
      <section className="max-w-7xl mx-auto px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: Shield,     label: 'Fully Insured',    sub: 'Every booking protected' },
            { icon: Clock,      label: '24/7 Support',     sub: 'Always here for you' },
            { icon: Star,       label: '4.9 Star Rated',   sub: '2,400+ happy travellers' },
            { icon: Headphones, label: 'Expert Guides',    sub: 'Local knowledge, global standards' },
          ].map(i => (
            <div key={i.label} className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center shrink-0">
                <i.icon className="w-5 h-5 text-brand-primary" />
              </div>
              <div>
                <p className="font-bold text-slate-800 text-sm">{i.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{i.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Featured Tours ── */}
      <section className="max-w-7xl mx-auto px-8 py-16">
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="text-brand-primary font-bold tracking-[0.2em] uppercase text-xs">Featured</span>
            <h2 className="text-4xl font-display font-bold text-brand-primary mt-1">Unmissable Experiences</h2>
          </div>
          <Link to="/tours" className="text-slate-400 font-bold hover:text-brand-primary transition-colors flex items-center gap-2 text-sm uppercase tracking-widest">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {featuredTours.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-3xl overflow-hidden border border-slate-100 animate-pulse">
                <div className="h-64 bg-slate-200" />
                <div className="p-6 space-y-3"><div className="h-5 bg-slate-200 rounded w-3/4" /><div className="h-4 bg-slate-100 rounded w-1/2" /></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredTours.map((tour, idx) => (
              <motion.div
                key={tour.id}
                whileHover={{ y: -8 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.12 }}
                className="bg-white rounded-3xl overflow-hidden shadow-xl shadow-slate-200/60 border border-slate-100 group"
              >
                <div className="h-56 relative overflow-hidden bg-slate-100">
                  {tour.coverImageUrl
                    ? <img src={tour.coverImageUrl} alt={tour.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    : <div className="w-full h-full flex items-center justify-center text-5xl">{tour.category === 'SEA' ? '🌊' : tour.category === 'AIR' ? '🪂' : '🏔️'}</div>
                  }
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold text-brand-primary uppercase tracking-wider">
                    {tour.region}
                  </div>
                  <div className="absolute top-4 right-4 bg-brand-primary text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    {tour.category}
                  </div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <p className="font-display font-bold text-lg leading-tight drop-shadow">{tour.title}</p>
                  </div>
                </div>
                <div className="p-6">
                  {tour.description && <p className="text-sm text-slate-500 line-clamp-2 mb-4">{tour.description}</p>}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Adult from</p>
                      <p className="text-xl font-display font-bold text-brand-primary">${(tour.adultPriceCents / 100).toLocaleString('en-US')}</p>
                    </div>
                    <Link to={`/tours/${tour.slug}`}>
                      <button className="bg-brand-primary text-white px-5 py-2.5 rounded-2xl text-xs font-bold hover:bg-brand-primary transition-all group-hover:bg-brand-primary">
                        View Tour
                      </button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* ── Destination Highlights ── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-12">
            <span className="text-brand-primary font-bold tracking-[0.2em] uppercase text-xs">The Island</span>
            <h2 className="text-4xl font-display font-bold text-brand-primary mt-1">Mauritius at a Glance</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[480px]">
            <div className="relative rounded-3xl overflow-hidden group cursor-pointer">
              <img src="/images/rumman-amin-6iSZzFMKQbs-unsplash.jpg" alt="Luxury Resorts" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute bottom-6 left-6 text-white">
                <p className="text-xs font-bold uppercase tracking-widest text-brand-primary mb-1">Accommodation</p>
                <p className="font-display font-bold text-2xl">Luxury Resorts</p>
              </div>
            </div>
            <div className="grid grid-rows-2 gap-6">
              <div className="relative rounded-3xl overflow-hidden group cursor-pointer">
                <img src="/images/pexels-asadphoto-9482122.jpg" alt="Beach" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 text-white">
                  <p className="text-xs font-bold uppercase tracking-widest text-brand-primary mb-0.5">Explore</p>
                  <p className="font-display font-bold text-lg">Pristine Beaches</p>
                </div>
              </div>
              <div className="relative rounded-3xl overflow-hidden group cursor-pointer">
                <img src="/images/pexels-dimitri-baret-3505176-6624614.jpg" alt="Culture" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 text-white">
                  <p className="text-xs font-bold uppercase tracking-widest text-brand-primary mb-0.5">Culture</p>
                  <p className="font-display font-bold text-lg">Authentic Colours</p>
                </div>
              </div>
            </div>
            <div className="relative rounded-3xl overflow-hidden group cursor-pointer">
              <img src="/images/pexels-ahmet-kadioglu-650478141-32552944.jpg" alt="Watersports" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute bottom-6 left-6 text-white">
                <p className="text-xs font-bold uppercase tracking-widest text-brand-primary mb-1">Adventure</p>
                <p className="font-display font-bold text-2xl">Water Sports</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Services ── */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-12">
            <span className="text-brand-primary font-bold tracking-[0.2em] uppercase text-xs">Services</span>
            <h2 className="text-4xl font-display font-bold text-brand-primary mt-1">Everything You Need</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Car, title: 'Car Rental', desc: 'Premium fleet from economy to luxury. Chauffeur-driven or self-drive.', link: '/car-rental', img: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=600&q=80' },
              { icon: MapPin, title: 'Transfers', desc: 'Fixed-price airport & hotel transfers with real-time flight monitoring.', link: '/transfers', img: '/images/pexels-umaraffan499-88212.jpg' },
              { icon: MapPin, title: 'Tours & Activities', desc: 'Land, sea and air adventures curated by local experts.', link: '/tours', img: '/images/pexels-asadphoto-3319712.jpg' },
            ].map(s => (
              <Link key={s.title} to={s.link} className="group">
                <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 hover:shadow-xl transition-all duration-300">
                  <div className="h-48 overflow-hidden">
                    <img src={s.img} alt={s.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="p-7">
                    <div className="w-11 h-11 rounded-2xl bg-brand-primary/10 flex items-center justify-center mb-4 group-hover:bg-brand-primary transition-colors">
                      <s.icon className="w-5 h-5 text-brand-primary group-hover:text-white transition-colors" />
                    </div>
                    <h4 className="font-display font-bold text-xl text-slate-900 mb-2">{s.title}</h4>
                    <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
                    <div className="mt-4 flex items-center gap-2 text-brand-primary text-sm font-bold">
                      Explore <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative py-28 overflow-hidden">
        <img src="/images/xavier-coiffic-REz1OCM2fmY-unsplash.jpg" alt="Mauritius beach" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-brand-primary/75" />
        <div className="max-w-4xl mx-auto px-8 text-center relative z-10">
          <span className="text-brand-primary font-bold tracking-[0.3em] uppercase text-xs">B2B Partners</span>
          <h2 className="text-5xl font-display font-bold text-white mt-3 mb-4">Scale Your Travel Business</h2>
          <p className="text-white/60 text-lg mb-10 max-w-xl mx-auto">
            Join our B2B platform to access wholesale rates, live commissions, and a full booking management portal.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link to="/auth/agent-register">
              <button className="bg-brand-primary text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-brand-secondary transition-all shadow-xl shadow-brand-primary/30">
                Register as Agent
              </button>
            </Link>
            <Link to="/auth/login">
              <button className="bg-white/10 border border-white/20 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white/20 transition-all backdrop-blur-sm">
                Partner Login
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
