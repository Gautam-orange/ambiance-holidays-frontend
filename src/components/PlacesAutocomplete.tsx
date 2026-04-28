import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MapPin } from 'lucide-react';
import { searchPlaces, getShortName, type NominatimResult } from '../lib/geocode';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  showIcon?: boolean;
}

export default function PlacesAutocomplete({
  value,
  onChange,
  placeholder,
  className,
  showIcon = true,
}: Props) {
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  // Position of the dropdown (fixed, so it escapes any overflow:hidden parent)
  const [dropPos, setDropPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Recalculate dropdown position whenever it opens or window scrolls/resizes
  const updatePos = useCallback(() => {
    if (!inputRef.current) return;
    const r = inputRef.current.getBoundingClientRect();
    setDropPos({ top: r.bottom + 6, left: r.left, width: r.width });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePos();
    window.addEventListener('scroll', updatePos, true);
    window.addEventListener('resize', updatePos);
    return () => {
      window.removeEventListener('scroll', updatePos, true);
      window.removeEventListener('resize', updatePos);
    };
  }, [open, updatePos]);

  const doSearch = useCallback(async (query: string) => {
    if (query.length < 2) { setSuggestions([]); setOpen(false); return; }
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    const results = await searchPlaces(query, 'mu,in', abortRef.current.signal);
    setLoading(false);
    setSuggestions(results);
    if (results.length > 0) {
      setOpen(true);
      updatePos();
    } else {
      setOpen(false);
    }
  }, [updatePos]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 650);
  };

  const handleSelect = (result: NominatimResult) => {
    onChange(getShortName(result));
    setSuggestions([]);
    setOpen(false);
  };

  // Close on outside click (check both wrapper and portal dropdown)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const portalEl = document.getElementById('places-dropdown-portal');
      if (
        wrapperRef.current && !wrapperRef.current.contains(target) &&
        (!portalEl || !portalEl.contains(target))
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const dropdown =
    open && suggestions.length > 0 && dropPos
      ? createPortal(
          <ul
            id="places-dropdown-portal"
            style={{
              position: 'fixed',
              top: dropPos.top,
              left: dropPos.left,
              width: dropPos.width,
              zIndex: 99999,
            }}
            className="bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto"
          >
            {suggestions.map(result => (
              <li
                key={result.place_id}
                onMouseDown={e => { e.preventDefault(); handleSelect(result); }}
                className="flex items-start gap-2.5 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors text-sm"
              >
                <MapPin className="w-3.5 h-3.5 text-brand-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-800 leading-tight text-sm">
                    {getShortName(result)}
                  </p>
                  <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                    {result.display_name.split(',').slice(1, 3).join(',').trim()}
                  </p>
                </div>
              </li>
            ))}
          </ul>,
          document.body,
        )
      : null;

  return (
    <div className="relative w-full" ref={wrapperRef}>
      {showIcon && (
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-primary pointer-events-none z-10" />
      )}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onFocus={() => { if (suggestions.length > 0) { setOpen(true); updatePos(); } }}
        placeholder={placeholder}
        className={className}
        style={showIcon ? { paddingLeft: '2rem' } : undefined}
        autoComplete="off"
        spellCheck={false}
      />
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <div className="w-3 h-3 border-2 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
        </div>
      )}
      {dropdown}
    </div>
  );
}
