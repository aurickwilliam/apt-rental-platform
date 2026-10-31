import { useCallback, useEffect, useState } from "react";

import {
  addRecentApartmentSearch,
  loadRecentApartmentSearches,
  saveRecentApartmentSearches,
  type RecentApartmentSearch,
} from "@/service/search/recentApartmentSearches";

/**
 * Recent apartments opened from the Search tab for the signed-in account
 * (device only). Empty and inert until the account id is known.
 */
export function useRecentApartmentSearches(authUserId: string | null | undefined) {
  const [recent, setRecent] = useState<RecentApartmentSearch[]>([]);

  useEffect(() => {
    let active = true;
    if (!authUserId) return;
    void loadRecentApartmentSearches(authUserId).then((apartments) => {
      if (active) setRecent(apartments);
    });
    return () => {
      active = false;
    };
  }, [authUserId]);

  const remember = useCallback(
    (apartment: RecentApartmentSearch) => {
      if (!authUserId) return;
      setRecent((current) => {
        const next = addRecentApartmentSearch(current, apartment);
        void saveRecentApartmentSearches(authUserId, next);
        return next;
      });
    },
    [authUserId],
  );

  const clear = useCallback(() => {
    if (!authUserId) return;
    setRecent([]);
    void saveRecentApartmentSearches(authUserId, []);
  }, [authUserId]);

  return { recent: authUserId ? recent : [], remember, clear };
}
