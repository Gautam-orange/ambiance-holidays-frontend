import { useEffect, useState } from 'react';

/**
 * Returns the input value after no further changes have been made for
 * `delayMs` (default 300ms). Useful for search inputs to avoid hammering
 * the API on every keystroke.
 *
 * Pass any serialisable value — string, number, etc.
 */
export function useDebouncedValue<T>(value: T, delayMs: number = 300): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}
