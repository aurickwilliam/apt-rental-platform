"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Returns a debounced version of `fn` plus `cancel`/`flush` controls.
 * The latest `fn` is always invoked (via ref) so callers never deal with
 * stale closures. Used by Browse search + filters to sync state to the URL
 * without a server round-trip on every keystroke/slider tick.
 */
export function useDebouncedCallback<T extends unknown[]>(
  fn: (...args: T) => void,
  delay: number,
) {
  const fnRef = useRef(fn);

  useEffect(() => {
    fnRef.current = fn;
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancel = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const flush = useCallback(
    (...args: T) => {
      cancel();
      fnRef.current(...args);
    },
    [cancel],
  );

  const debounced = useCallback(
    (...args: T) => {
      cancel();
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        fnRef.current(...args);
      }, delay);
    },
    [cancel, delay],
  );

  useEffect(() => cancel, [cancel]);

  return { debounced, cancel, flush };
}
