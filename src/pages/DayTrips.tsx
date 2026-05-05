import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Clock, Users, MapPin, ChevronRight } from 'lucide-react';

type DayTrip = {
  id: string;
  slug: string;
  title: string;
  region: string;
  tripType: 'SHARED' | 'PRIVATE';
  theme: string;
  duration: 'HALF_DAY' | 'FULL_DAY';
  adultPriceCents: number;
  maxPax: number;
  coverImageUrl: string;
  availabilityMode: 'always' | 'on_request';
};

const REGIONS = ['NORTH', 'SOUTH', 'EAST', 'WEST'];
const THEMES = ['NATURE', 'ADVENTURE', 'CULTURAL', 'SEA_ACTIVITIES', 'BEACH'];
const DURATIONS = ['HALF_DAY', 'FULL_DAY'];

export default function DayTrips() {
  const [params, setParams] = useSearchParams();
  const [trips, setTrips] = useState<DayTrip[]>([]);
  const [loading, setLoading] = useState(true);

  const region = params.get('region') || '';
  const tripType = params.get('type') || '';
  const theme = params.get('theme') || '';
  const duration = params.get('duration') || '';

  useEffect(() => {
    setLoading(true);
    const q = new URLSearchParams({ ...(region && { region }), ...(tripType && { tripType }), ...(theme && { theme }), ...(duration && { duration }) });
    fetch(`/api/v1/catalog/day-trips?${q}`)
      .then(r => r.json())
      .then(d => setTrips(Array.isArray(d.data) ? d.data : (d.data?.content ?? [])))
      .catch(() => setTrips([]))
      .finally(() => setLoading(false));
  }, [region, tripType, theme, duration]);

  const set = (key: string, val: string) => {
    const next = new URLSearchParams(params);
    if (val) next.set(key, val); else next.delete(key);
    setParams(next);
  };

  const fmt = (cents: number) => `$${(cents / 100).toLocaleString('en-US')}`;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Local Experiences</h1>
      <p className="text-gray-500 mb-8">Explore Mauritius on a guided day excursion</p>

      <div className="flex gap-8">
        {/* Filter sidebar — LEFT per design */}
        <aside className="w-64 flex-shrink-0 space-y-6">
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">Region</p>
            <div className="flex flex-wrap gap-2">
              {REGIONS.map(r => (
                <button
                  key={r}
                  onClick={() => set('region', region === r ? '' : r)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${region === r ? 'bg-brand-primary text-white border-brand-primary' : 'border-gray-300 text-gray-600 hover:border-brand-400'}`}
                >
                  {r[0]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">Type</p>
            {['SHARED', 'PRIVATE'].map(t => (
              <label key={t} className="flex items-center gap-2 mb-2 cursor-pointer">
                <input type="radio" name="type" checked={tripType === t} onChange={() => set('type', tripType === t ? '' : t)} className="accent-brand-600" />
                <span className="text-sm text-gray-600">{t}</span>
              </label>
            ))}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">Theme</p>
            {THEMES.map(t => (
              <label key={t} className="flex items-center gap-2 mb-2 cursor-pointer">
                <input type="checkbox" checked={theme === t} onChange={() => set('theme', theme === t ? '' : t)} className="accent-brand-600" />
                <span className="text-sm text-gray-600">{t.replace('_', ' ')}</span>
              </label>
            ))}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">Duration</p>
            {DURATIONS.map(d => (
              <label key={d} className="flex items-center gap-2 mb-2 cursor-pointer">
                <input type="radio" name="duration" checked={duration === d} onChange={() => set('duration', duration === d ? '' : d)} className="accent-brand-600" />
                <span className="text-sm text-gray-600">{d.replace('_', ' ')}</span>
              </label>
            ))}
          </div>
        </aside>

        {/* Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3,4,5,6].map(i => <div key={i} className="bg-gray-100 rounded-xl h-72 animate-pulse" />)}
            </div>
          ) : trips.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400 text-lg mb-4">No local experiences match your filters</p>
              <button onClick={() => setParams(new URLSearchParams())} className="text-brand-primary font-medium hover:underline">
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trips.map(trip => (
                <Link key={trip.id} to={`/day-trips/${trip.slug}`} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                  <div className="relative h-48 bg-gray-200 overflow-hidden">
                    {trip.coverImageUrl && (
                      <img src={trip.coverImageUrl} alt={trip.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    )}
                    <span className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium ${trip.tripType === 'SHARED' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                      {trip.tripType}
                    </span>
                    {trip.availabilityMode === 'on_request' && (
                      <span className="absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">On Request</span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{trip.title}</h3>
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{trip.region}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{trip.duration.replace('_', ' ')}</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />Up to {trip.maxPax}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs text-gray-400">Per passenger</span>
                        <p className="font-bold text-gray-900">{fmt(trip.adultPriceCents)}</p>
                      </div>
                      <span className="text-brand-primary text-sm font-medium flex items-center gap-1">
                        View <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
