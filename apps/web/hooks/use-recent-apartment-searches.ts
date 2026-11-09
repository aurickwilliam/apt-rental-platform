"use client";

import { useCallback, useEffect, useRef } from "react";
import { createClient as createBrowserClient } from "@repo/supabase/browser";

import { reconcileRecentApartments } from "@/app/browse/lib/reconcile-recent-apartments";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { useUser } from "@/hooks/use-user";
import {
  loadRecentApartmentSearches,
  rememberRecentApartmentSearch,
  saveRecentApartmentSearches,
  toRecentApartmentSearch,
  type RecentApartmentSearch,
  type RecentApartmentSource,
} from "@/lib/recent-apartment-searches";

type SetRecent = (update: RecentApartmentSearch[]) => void;

/**
 * Recent apartments for the signed-in account (or the guest list), read each
 * time `active` turns on so a listing opened since the last focus is included,
 * and again once the account is known. Shows the saved list at once, then
 * swaps in current details and drops listings that are gone.
 */
export function useRecentApartmentSearches(active: boolean) {
  const { user, loading } = useUser();
  const authUserId = user?.id;
  const setRecentRef = useRef<SetRecent | null>(null);

  const load = useCallback(async () => {
    if (!active || loading) return [];
    const stored = loadRecentApartmentSearches(authUserId);
    if (stored.length > 0) {
      void reconcileRecentApartments(createBrowserClient(), stored)
        .then((fresh) => {
          if (JSON.stringify(fresh) === JSON.stringify(stored)) return;
          saveRecentApartmentSearches(authUserId, fresh);
          setRecentRef.current?.(fresh);
        })
        .catch(() => {
          // Keep the saved list when the check fails.
        });
    }
    return stored;
  }, [active, loading, authUserId]);

  const { data, setData } = useAsyncResource<RecentApartmentSearch[]>(
    load,
    [],
    "Unable to load recent searches",
  );

  useEffect(() => {
    setRecentRef.current = setData;
  }, [setData]);

  const clear = useCallback(() => {
    saveRecentApartmentSearches(authUserId, []);
    setData([]);
  }, [authUserId, setData]);

  return { recent: data, clear };
}

/** Records an opened apartment for the current account; skipped until it is known. */
export function useRememberRecentApartment() {
  const { user, loading } = useUser();
  const authUserId = user?.id;

  return useCallback(
    (apartment: RecentApartmentSource) => {
      if (loading) return;
      rememberRecentApartmentSearch(authUserId, toRecentApartmentSearch(apartment));
    },
    [authUserId, loading],
  );
}
