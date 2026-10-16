import { useCallback, useEffect, useState } from 'react';

import {
  addRecentPlaceSearch,
  loadRecentPlaceSearches,
  saveRecentPlaceSearches,
  type RecentPlaceSearch,
} from '@/service/places/recentPlaceSearches';

/**
 * Recent map-pin searches for the signed-in account (device only). Empty and
 * inert until the account id is known.
 */
export function useRecentPlaceSearches(authUserId: string | null | undefined) {
  const [recent, setRecent] = useState<RecentPlaceSearch[]>([]);

  useEffect(() => {
    let active = true;
    if (!authUserId) return;
    void loadRecentPlaceSearches(authUserId).then((places) => {
      if (active) setRecent(places);
    });
    return () => {
      active = false;
    };
  }, [authUserId]);

  const remember = useCallback(
    (place: RecentPlaceSearch) => {
      if (!authUserId) return;
      setRecent((current) => {
        const next = addRecentPlaceSearch(current, place);
        void saveRecentPlaceSearches(authUserId, next);
        return next;
      });
    },
    [authUserId],
  );

  const clear = useCallback(() => {
    if (!authUserId) return;
    setRecent([]);
    void saveRecentPlaceSearches(authUserId, []);
  }, [authUserId]);

  return { recent: authUserId ? recent : [], remember, clear };
}
