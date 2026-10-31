import { useCallback, useEffect, useRef, useState } from "react";

import {
  addRecentApartmentSearch,
  loadRecentApartmentSearches,
  mergeRecentApartmentSearches,
  saveRecentApartmentSearches,
  type RecentApartmentSearch,
} from "@/service/search/recentApartmentSearches";
import { reconcileRecentApartmentSearches } from "@/service/search/reconcileRecentApartments";

/**
 * Recent apartments opened from the Search tab for the signed-in account
 * (device only). Empty and inert until the account id is known. Once loaded,
 * the saved list is checked against the database in the background so renamed
 * listings refresh and deleted or hidden ones drop out.
 */
export function useRecentApartmentSearches(authUserId: string | null | undefined) {
  const [recent, setRecent] = useState<RecentApartmentSearch[]>([]);
  // Latest list, so remember() stays pure and never races the initial load.
  const recentRef = useRef<RecentApartmentSearch[]>([]);

  useEffect(() => {
    let active = true;
    if (!authUserId) return;
    void (async () => {
      const stored = await loadRecentApartmentSearches(authUserId);
      if (!active) return;
      // An apartment opened before storage answered stays on top.
      const merged = mergeRecentApartmentSearches(recentRef.current, stored);
      recentRef.current = merged;
      setRecent(merged);

      try {
        const fresh = await reconcileRecentApartmentSearches(merged);
        if (!active || JSON.stringify(fresh) === JSON.stringify(merged)) return;
        recentRef.current = fresh;
        setRecent(fresh);
        void saveRecentApartmentSearches(authUserId, fresh);
      } catch {
        // Keep the saved list when the check fails.
      }
    })();
    return () => {
      active = false;
      recentRef.current = [];
    };
  }, [authUserId]);

  const remember = useCallback(
    (apartment: RecentApartmentSearch) => {
      if (!authUserId) return;
      const next = addRecentApartmentSearch(recentRef.current, apartment);
      recentRef.current = next;
      setRecent(next);
      void saveRecentApartmentSearches(authUserId, next);
    },
    [authUserId],
  );

  const clear = useCallback(() => {
    if (!authUserId) return;
    recentRef.current = [];
    setRecent([]);
    void saveRecentApartmentSearches(authUserId, []);
  }, [authUserId]);

  return { recent: authUserId ? recent : [], remember, clear };
}
