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
export function useAsyncResource<T>(load: Loader<T>, initialData: T, fallbackError: string) {
  const [state, setState] = useState<ResourceState<T>>({
    data: initialData,
    error: null,
    settledLoader: null,
    refreshing: false,
  });
  const latestRequest = useRef(0);

  const run = useCallback(
    (loader: Loader<T>) => {
      const request = ++latestRequest.current;
      return loader().then(
        (data) => {
          if (request !== latestRequest.current) return;
          setState({ data, error: null, settledLoader: loader, refreshing: false });
        },
        (err: unknown) => {
          if (request !== latestRequest.current) return;
          console.error(fallbackError, err);
          setState((current) => ({
            ...current,
            error: errorMessage(err, fallbackError),
            settledLoader: loader,
            refreshing: false,
          }));
        },
      );
    },
    [fallbackError],
  );

  useEffect(() => {
    void run(load);
  }, [load, run]);

  /** Reloads with a loading state; resolves once the new data is in. */
  const refresh = useCallback(async () => {
    setState((current) => ({ ...current, error: null, refreshing: true }));
    await run(load);
  }, [load, run]);

  /** Local (optimistic) edits to the loaded data. */
  const setData = useCallback((update: DataUpdate<T>) => {
    setState((current) => ({
      ...current,
      data: typeof update === "function" ? (update as (value: T) => T)(current.data) : update,
    }));
  }, []);

  const isCurrent = state.settledLoader === load;
  return {
    data: state.data,
    loading: !isCurrent || state.refreshing,
    error: isCurrent ? state.error : null,
    refresh,
    setData,
  };
}
