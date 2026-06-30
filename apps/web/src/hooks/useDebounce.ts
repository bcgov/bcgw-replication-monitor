import { useEffect, useState } from "react";

/**
 * Debounces a value — returns the latest value only after `delay` ms
 * have passed without the value changing.
 *
 * Useful for search inputs to avoid firing a request on every keystroke.
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
