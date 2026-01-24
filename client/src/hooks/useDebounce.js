import { useState, useEffect } from 'react';

/**
 * Returns a debounced value that updates after `ms` delay when `value` changes.
 */
export function useDebounce(value, ms) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);

  return debounced;
}
