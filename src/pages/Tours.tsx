import React, { useEffect, useState } from 'react';
import { MapPin, Clock, Users, ChevronRight } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { catalogTours, Tour } from '../api/tours';
import { cn } from '../lib/utils';

const CATEGORY_ICONS: Record<string, string> = { LAND: '🏔️', SEA: '🌊', AIR: '🪂' };
const REGIONS = ['NORTH', 'SOUTH', 'EAST', 'WEST', 'CENTRAL'];
const THEMES = ['NATURE', 'ADVENTURE', 'CULTURAL', 'SEA_ACTIVITIES', 'BEACH'];

function RadioOption({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-600">
      <input type="radio" checked={checked} onChange={onChange} className="accent-brand-primary w-4 h-4" />
      {label}
    </label>
  );
}

function CheckOption({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-600">
      <input type="checkbox" checked={checked} onChange={onChange} className="accent-brand-primary w-4 h-4" />
      {label}
    </label>
  );
}

export default function Tours() {
  const [searchParams] = useSearchParams();
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(() => searchParams.get('q') ?? '');
  const [category, setCategory] = useState('');
  const [region, setRegion] = useState('');
  const [duration, setDuration] = useState('');
  const [themes, setThemes] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLoading(true);
    catalogTours({
      search: search || undefined,
      category: category || undefined,
      region: region || undefined,
      duration: duration || undefined,
    })
      .then(r => setTours(r.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, category, region, duration]);

  const toggleTheme = (t: string) => {
    setThemes(prev => { const n = new Set(prev); n.has(t) ? n.delete(t) : n.add(t); return n; });
  };

  const clearFilters = () => {
    setCategory(''); setRegion(''); setDuration(''); setThemes(new Set());
  };

  const filteredTours = themes.size > 0
    ? tours.filter(t => themes.has((t as any).theme))
    : tours;

  const FilterPanel = (
    <div className="space-y-8 lg:sticky lg:top-28 h-fit bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <h3 className="font-bold text-brand-primary">Filters</h3>
        <button onClick={clearFilters} className="text-[10px] font-bold uppercase tracking-widest text-brand-primary underline underline-offset-4">
          Clear
        </button>
      </div>

      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Category</h4>
        <RadioOption label="All" checked={category === ''} onChange={() => setCategory('')} />
        {['LAND', 'SEA', 'AIR'].map(c => (
          <RadioOption key={c} label={c.charAt(0) + c.slice(1).toLowerCase()} checked={category === c} onChange={() => setCategory(c)} />
        ))}
      </div>

      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Region</h4>
        <RadioOption label="All" checked={region === ''} onChange={() => setRegion('')} />
        {REGIONS.map(r => (
          <RadioOption key={r} label={r.charAt(0) + r.slice(1).toLowerCase()} checked={region === r} onChange={() => setRegion(r)} />
        ))}
      </div>

      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Theme</h4>
        {THEMES.map(t => (
          <CheckOption key={t} label={t.replace(/_/g, ' ').charAt(0) + t.replace(/_/g, ' ').slice(1).toLowerCase()} checked={themes.has(t)} onChange={() => toggleTheme(t)} />
        ))}
      </div>

      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Duration</h4>
        <RadioOption label="Any" checked={duration === ''} onChange={() => setDuration('')} />
        <RadioOption label="Half Day" checked={duration === 'HALF_DAY'} onChange={() => setDuration('HALF_DAY')} />
        <RadioOption label="Full Day" checked={duration === 'FULL_DAY'} onChange={() => setDuration('FULL_DAY')} />
      </div>
    </div>
  );

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="relative text-white py-28 overflow-hidden">
        <img src="/images/pexels-asadphoto-3319712.jpg" alt="Île aux Cerfs" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-900/85 via-brand-900/60 to-brand-900/30" />
        <div className="max-w-7xl mx-auto px-8 relative z-10 space-y-6">
          <span className="inline-block bg-brand-primary/20 border border-brand-primary/40 text-brand-primary font-bold tracking-[0.3em] uppercase text-xs px-4 py-2 rounded-full">
            Tours & Activities
          </span>
          <h1 className="text-6xl font-display font-bold leading-tight">Excursions & <span className="text-brand-primary">Adventures</span></h1>
          <p className="text-white/60 max-w-xl font-medium text-lg">Curated world-class experiences across Mauritius — land, sea and air.</p>
          <div className="max-w-lg pt-2">
            <input
              type="text"
              placeholder="Search tours…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-5 py-3 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-white/50 outline-none focus:bg-white/20 transition-all backdrop-blur-sm"
            />
          </div>
        </div>
      </div>

      {/* Content — filters LEFT, tours RIGHT */}
      <div className="max-w-7xl mx-auto px-8 py-16 grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* Filters — LEFT */}
        <div>{FilterPanel}</div>

        {/* Tours grid — 3 cols */}
        <div className="lg:col-span-3 space-y-8">
          <p className="text-sm text-slate-500">{filteredTours.length} tour{filteredTours.length !== 1 ? 's' : ''} found</p>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="bg-white rounded-3xl h-80 animate-pulse" />
              ))}
            </div>
          ) : filteredTours.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <p className="font-bold text-lg">No tours match your filters.</p>
              <button onClick={clearFilters} className="mt-3 text-brand-primary underline text-sm">Clear filters</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredTours.map(tour => (
                <motion.div key={tour.id} whileHover={{ y: -6 }}
                  className="bg-white rounded-3xl overflow-hidden shadow-xl shadow-slate-200/40 border border-slate-100 group">
                  <div className="h-56 bg-slate-100 relative overflow-hidden">
                    {tour.coverImageUrl ? (
                      <img src={tour.coverImageUrl} alt={tour.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl bg-gradient-to-br from-brand-900 to-brand-primary/50">
                        {CATEGORY_ICONS[tour.category] ?? '🗺️'}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute top-4 left-4 flex gap-2">
                      <span className="bg-brand-primary text-white px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        {tour.category}
                      </span>
                      {tour.status === 'ON_REQUEST' && (
                        <span className="bg-yellow-400 text-yellow-900 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                          On Request
                        </span>
                      )}
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="font-display font-bold text-white text-lg leading-tight drop-shadow">{tour.title}</h3>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-brand-primary" />{tour.region}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-brand-primary" />{tour.duration.replace('_', ' ')}</span>
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-brand-primary" />Max {tour.maxPax}</span>
                    </div>
                    {tour.description && <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{tour.description}</p>}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Adult from</p>
                        <p className="text-xl font-display font-bold text-brand-primary">${(tour.adultPriceCents / 100).toLocaleString('en-US')}</p>
                      </div>
                      <Link to={`/tours/${tour.slug}`}>
                        <button className="flex items-center gap-1.5 px-5 py-2.5 bg-brand-primary text-white text-xs font-bold rounded-2xl hover:bg-brand-primary transition-all group-hover:bg-brand-primary">
                          View Tour <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
