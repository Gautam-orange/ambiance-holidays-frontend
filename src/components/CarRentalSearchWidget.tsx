import React, { useState } from 'react';
import { ArrowRight, Calendar, MapPin, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import PlacesAutocomplete from './PlacesAutocomplete';

const ADULT_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/** Reusable "icon + label + input" shell to keep field styling uniform. */
function FieldShell({
  icon: Icon,
  label,
  iconClass,
  children,
}: {
  icon: React.ElementType;
  label: string;
  iconClass?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5 min-w-0">
      <label className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
        <Icon className={cn('w-3.5 h-3.5', iconClass ?? 'text-emerald-500')} />
        {label}
      </label>
      <div className="bg-slate-50 rounded-xl border border-slate-100 px-4 py-3 h-[58px] flex items-center">
        {children}
      </div>
    </div>
  );
}

export type CarRentalSearchValues = {
  pickup: string;
  dropoff: string;
  adults: number;
  pickupDate: string;     // YYYY-MM-DD
  pickupTime: string;     // HH:MM
  dropoffDate: string;    // YYYY-MM-DD
  dropoffTime: string;    // HH:MM
};

type Props = {
  /** Pre-fill values (e.g. when arriving from /car-rental?from=...&to=...). */
  initial?: Partial<CarRentalSearchValues>;
  /**
   * Called with the values when the user clicks Search. If not provided, the
   * widget navigates to /car-rental?... itself (default behaviour for the
   * landing page hero).
   */
  onSearch?: (values: CarRentalSearchValues) => void;
  /** Compact white card without the outer animation; useful when stacking inside another hero. */
  embedded?: boolean;
};

/**
 * Hero "Car Rental" search widget. Used on the home page and on the
 * /car-rental listing page so visitors can refine their search without
 * jumping back to home.
 */
export default function CarRentalSearchWidget({ initial, onSearch, embedded = false }: Props) {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];

  const [pickup, setPickup] = useState(initial?.pickup ?? '');
  const [dropoff, setDropoff] = useState(initial?.dropoff ?? '');
  const [adults, setAdults] = useState(initial?.adults ?? 2);
  const [pickupDate, setPickupDate] = useState(initial?.pickupDate ?? '');
  const [pickupTime, setPickupTime] = useState(initial?.pickupTime ?? '');
  const [dropoffDate, setDropoffDate] = useState(initial?.dropoffDate ?? '');
  const [dropoffTime, setDropoffTime] = useState(initial?.dropoffTime ?? '');

  const handleSearch = () => {
    const values: CarRentalSearchValues = {
      pickup, dropoff, adults, pickupDate, pickupTime, dropoffDate, dropoffTime,
    };
    if (onSearch) {
      onSearch(values);
      return;
    }
    const p = new URLSearchParams();
    if (pickup) p.set('from', pickup);
    if (dropoff) p.set('to', dropoff);
    if (adults) p.set('adults', String(adults));
    if (pickupDate) p.set('date', pickupDate);
    if (pickupTime) p.set('time', pickupTime);
    if (dropoffDate) p.set('dropoffDate', dropoffDate);
    if (dropoffTime) p.set('dropoffTime', dropoffTime);
    navigate(`/car-rental${p.toString() ? '?' + p.toString() : ''}`);
  };

  const grid = (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] gap-4 items-end">
        <FieldShell icon={MapPin} label="Pickup Location">
          <PlacesAutocomplete
            value={pickup}
            onChange={setPickup}
            placeholder="Where to next?"
            className="bg-transparent border-none outline-none text-sm font-medium w-full text-slate-700 placeholder:text-slate-400"
          />
        </FieldShell>

        <FieldShell icon={Calendar} label="Pickup Date & Time">
          <input
            type="datetime-local"
            value={pickupDate && pickupTime ? `${pickupDate}T${pickupTime}` : pickupDate ? `${pickupDate}T00:00` : ''}
            min={`${today}T00:00`}
            onChange={e => {
              const [d, t] = e.target.value.split('T');
              setPickupDate(d ?? '');
              setPickupTime(t ?? '');
            }}
            className="bg-transparent border-none outline-none text-sm font-medium w-full text-slate-700"
          />
        </FieldShell>

        <FieldShell icon={MapPin} label="Drop Location" iconClass="text-brand-primary">
          <PlacesAutocomplete
            value={dropoff}
            onChange={setDropoff}
            placeholder="Drop location"
            className="bg-transparent border-none outline-none text-sm font-medium w-full text-slate-700 placeholder:text-slate-400"
          />
        </FieldShell>

        <FieldShell icon={Calendar} label="Drop Date & Time">
          <input
            type="datetime-local"
            value={dropoffDate && dropoffTime ? `${dropoffDate}T${dropoffTime}` : dropoffDate ? `${dropoffDate}T00:00` : ''}
            min={pickupDate ? `${pickupDate}T${pickupTime || '00:00'}` : `${today}T00:00`}
            onChange={e => {
              const [d, t] = e.target.value.split('T');
              setDropoffDate(d ?? '');
              setDropoffTime(t ?? '');
            }}
            className="bg-transparent border-none outline-none text-sm font-medium w-full text-slate-700"
          />
        </FieldShell>

        <FieldShell icon={Users} label="Adults">
          <select
            value={adults}
            onChange={e => setAdults(Number(e.target.value))}
            className="bg-transparent border-none outline-none text-sm font-medium w-full text-slate-700"
          >
            {ADULT_OPTIONS.map(n => <option key={n} value={n}>{n} Adult{n > 1 ? 's' : ''}</option>)}
          </select>
        </FieldShell>

        <button
          onClick={handleSearch}
          type="button"
          className="bg-brand-primary text-white h-[58px] px-8 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-brand-secondary transition-all shadow-md"
        >
          Search <ArrowRight className="w-4 h-4" />
        </button>
    </div>
  );

  // Embedded: caller provides its own white card wrapper (e.g. Home page tab).
  if (embedded) return grid;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.5 }}
      className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6"
    >
      {grid}
    </motion.div>
  );
}
