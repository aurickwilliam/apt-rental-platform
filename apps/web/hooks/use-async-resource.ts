"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Loader<T> = () => Promise<T>;
type DataUpdate<T> = T | ((current: T) => T);

interface ResourceState<T> {
  data: T;
  error: string | null;
  /** The loader whose result is in `data`; differs from the current one while it runs. */
  settledLoader: Loader<T> | null;
  refreshing: boolean;
  revalidating: boolean;
  revalidationError: string | null;
}

interface ResourceOptions<T> {
  /** Fresh request-owned data, not a cache. Skip only this loader's initial read. */
  initial?: { data: T; error?: string | null };
  /** Sensitive resources fail closed if a background access/read check fails. */
  clearOnRevalidateError?: boolean;
}

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

/**
 * Loads data when `load` changes (memoize it on its inputs) and on
 * `refresh()`. State only changes once a result arrives, so effects never
 * set state synchronously; `loading` is derived from whether the current
 * loader has settled. Responses from superseded loads are ignored.
 */
export function useAsyncResource<T>(load: Loader<T>, initialData: T, fallbackError: string, options: ResourceOptions<T> = {}) {
  const [state, setState] = useState<ResourceState<T>>({
    data: options.initial ? options.initial.data : initialData,
    error: options.initial?.error ?? null,
    settledLoader: options.initial ? load : null,
    refreshing: false,
    revalidating: false,
    revalidationError: null,
  });
  const seededLoader = useRef(options.initial ? load : null);
  const activeLoader = useRef<Loader<T> | null>(load);
  const emptyData = useRef(initialData);
  const { clearOnRevalidateError = false } = options;
  const latestRequest = useRef(0);

  const run = useCallback(
    (loader: Loader<T>, silent = false) => {
      if (activeLoader.current !== loader) return Promise.resolve(false);
      const request = ++latestRequest.current;
      const current = () => request === latestRequest.current && activeLoader.current === loader;
      let pending: Promise<T>;
      try {
        // Only background refresh sets progress; initial effects still update
        // state exclusively when their read settles.
        pending = silent ? Promise.resolve().then(() => {
          if (!current()) return emptyData.current;
          setState((previous) => ({ ...previous, revalidating: true, revalidationError: null }));
          return loader();
        }) : loader();
      } catch (error) {
        pending = Promise.reject(error);
      }
      return pending.then(
        (data) => {
          if (!current()) return false;
          setState({ data, error: null, settledLoader: loader, refreshing: false, revalidating: false, revalidationError: null });
          return true;
        },
        (err: unknown) => {
          if (!current()) return false;
          console.error(fallbackError, err);
          // A background refresh never replaces data the user is reading.
          if (silent && !clearOnRevalidateError) {
            setState((previous) => ({ ...previous, revalidating: false, revalidationError: errorMessage(err, fallbackError) }));
            return false;
          }
          setState((current) => ({
            ...current,
            data: silent ? emptyData.current : current.data,
            error: errorMessage(err, fallbackError),
            settledLoader: loader,
            refreshing: false,
            revalidating: false,
            revalidationError: null,
          }));
          return false;
        },
      );
    },
    [fallbackError, clearOnRevalidateError],
  );

  useEffect(() => {
    const requests = latestRequest;
    const active = activeLoader;
    active.current = load;
    if (seededLoader.current !== load) void run(load);
    return () => { requests.current++; active.current = null; };
  }, [load, run]);

  /** Reloads with a loading state; resolves once the new data is in. */
  const refresh = useCallback(async () => {
    if (activeLoader.current !== load) return false;
    setState((current) => ({ ...current, error: null, refreshing: true }));
    return run(load);
  }, [load, run]);

  /**
   * Reloads in the background: no loading state and no error takeover, so a
   * focus or retry refetch cannot unmount the screen the user is reading.
   */
  const revalidate = useCallback(() => run(load, true), [load, run]);

  /** Local (optimistic) edits to the loaded data. */
  const setData = useCallback((update: DataUpdate<T>) => {
    if (activeLoader.current !== load) return;
    setState((current) => ({
      ...current,
      data: current.settledLoader === load
        ? typeof update === "function" ? (update as (value: T) => T)(current.data) : update
        : current.data,
    }));
  }, [load]);

  const isCurrent = state.settledLoader === load;
  return {
    data: state.data,
    loading: !isCurrent || state.refreshing,
    error: isCurrent ? state.error : null,
    revalidating: isCurrent && state.revalidating,
    revalidationError: isCurrent ? state.revalidationError : null,
    refresh,
    revalidate,
    setData,
  };
}
