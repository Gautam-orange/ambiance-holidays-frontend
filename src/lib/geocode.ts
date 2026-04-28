/**
 * Shared Nominatim geocoding utilities.
 *
 * WHY this file exists
 * --------------------
 * Nominatim (OpenStreetMap) enforces a strict 1 request/second rate limit per IP.
 * Previously every component (PlacesAutocomplete × 2 fields + Transfers distance
 * calculator) fired its own fetch independently — easily 4-5 req/s when typing,
 * causing silent throttling and a "broken" autocomplete.
 *
 * This module solves it with:
 *  1. A module-level in-memory cache — same query never hits the network twice.
 *  2. A single pending-request deduplicator — concurrent calls for the same query
 *     share one fetch instead of racing each other.
 *  3. A strict 650 ms inter-request guard so we never exceed ~1 req/s total.
 */

export interface NominatimResult {
  place_id: number;
  display_name: string;
  name: string;
  lat: string;
  lon: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    suburb?: string;
    county?: string;
    state?: string;
    country?: string;
    road?: string;
    neighbourhood?: string;
  };
}

// ── Cache ────────────────────────────────────────────────────────────────────
const CACHE = new Map<string, NominatimResult[]>();
const PENDING = new Map<string, Promise<NominatimResult[]>>();

// ── Rate-limit guard ─────────────────────────────────────────────────────────
let lastRequestAt = 0;
const MIN_INTERVAL_MS = 650; // safely under 1 req/s

function waitForSlot(): Promise<void> {
  const now = Date.now();
  const wait = Math.max(0, lastRequestAt + MIN_INTERVAL_MS - now);
  lastRequestAt = now + wait;
  return wait > 0 ? new Promise(r => setTimeout(r, wait)) : Promise.resolve();
}

// ── Public: autocomplete search ───────────────────────────────────────────────
export async function searchPlaces(
  query: string,
  countryCodes = 'mu,in',
  signal?: AbortSignal,
): Promise<NominatimResult[]> {
  if (!query || query.length < 2) return [];

  const key = `search:${countryCodes}:${query.toLowerCase().trim()}`;
  if (CACHE.has(key)) return CACHE.get(key)!;
  if (PENDING.has(key)) return PENDING.get(key)!;

  const promise = (async () => {
    try {
      await waitForSlot();
      if (signal?.aborted) return [];

      const url =
        `https://nominatim.openstreetmap.org/search` +
        `?q=${encodeURIComponent(query)}` +
        `&countrycodes=${countryCodes}` +
        `&format=json&addressdetails=1&limit=6`;

      const res = await fetch(url, {
        signal,
        headers: { 'Accept-Language': 'en' },
      });

      if (!res.ok) throw new Error(`Nominatim ${res.status}`);
      const data: NominatimResult[] = await res.json();
      CACHE.set(key, data);
      return data;
    } catch (err: any) {
      if (err?.name === 'AbortError') return [];
      console.warn('[Geocode] searchPlaces failed:', err?.message);
      return [];
    } finally {
      PENDING.delete(key);
    }
  })();

  PENDING.set(key, promise);
  return promise;
}

// ── Public: single best match (for distance calculation) ─────────────────────
export async function geocodeOne(
  query: string,
  countryCodes = 'mu,in',
): Promise<NominatimResult | null> {
  const results = await searchPlaces(query, countryCodes);
  return results[0] ?? null;
}

// ── Public: Haversine distance between two lat/lng points (km) ───────────────
export function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Helper: human-readable short name from a result ──────────────────────────
export function getShortName(r: NominatimResult): string {
  const a = r.address;
  return (
    r.name ||
    a.neighbourhood ||
    a.suburb ||
    a.road ||
    a.village ||
    a.town ||
    a.city ||
    r.display_name.split(',')[0]
  );
}
