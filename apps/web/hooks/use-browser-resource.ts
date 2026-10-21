"use client";

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import {
  browserResourceId, DISABLED_RESOURCE, getBrowserResourceCache,
  type BrowserResourceKey, type BrowserResourceSnapshot,
} from "@/lib/browser-resource-cache";

const noSubscription = () => () => {};
const serverSnapshot = () => DISABLED_RESOURCE;

/** Explicitly opt-in; ordinary useAsyncResource consumers remain uncached. */
export function useBrowserResource<T>(key: BrowserResourceKey, load: () => Promise<T>, fallbackError: string) {
  const cache = getBrowserResourceCache();
  const id = browserResourceId(key);
  // Semantic identity, not callers' object allocation, owns the subscription.
  const stableKey = useMemo(() => key, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  const getSnapshot = useCallback(
    (): BrowserResourceSnapshot<T> => cache?.getSnapshot<T>(stableKey) ?? DISABLED_RESOURCE,
    [cache, stableKey],
  );
  const snapshot = useSyncExternalStore(cache?.subscribe ?? noSubscription, getSnapshot, serverSnapshot);

  useEffect(() => {
    if (snapshot.enabled) void cache?.load(stableKey, load, fallbackError);
  }, [cache, stableKey, load, fallbackError, snapshot.enabled, snapshot.hasData, snapshot.revision]);

  useEffect(() => {
    if (!snapshot.hasData || !cache) return;
    const timer = window.setTimeout(() => cache.expire(stableKey), Math.max(0, snapshot.expiresAt - Date.now()));
    return () => window.clearTimeout(timer);
  }, [cache, stableKey, snapshot.hasData, snapshot.expiresAt]);

  const refresh = useCallback(() => cache?.load(stableKey, load, fallbackError, true) ?? Promise.resolve(), [cache, stableKey, load, fallbackError]);
  useEffect(() => {
    const onFocus = () => { if (document.visibilityState === "visible") void cache?.load(stableKey, load, fallbackError); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [cache, stableKey, load, fallbackError]);

  return { ...snapshot, refresh };
}
