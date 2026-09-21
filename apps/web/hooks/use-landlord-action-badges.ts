"use client";

import { useCallback, useEffect, useState } from "react";

import {
  fetchLandlordBadgeCounts,
  setBadgeLastViewed,
  type ActionBadgeCategory,
  type ActionBadgeCounts,
} from "@/service/landlordActionBadgesService";

export type { ActionBadgeCategory, ActionBadgeCounts };

const EMPTY_COUNTS: ActionBadgeCounts = { maintenance: 0, visits: 0, applications: 0 };

export function useLandlordActionBadges() {
  const [counts, setCounts] = useState<ActionBadgeCounts>(EMPTY_COUNTS);

  const refresh = useCallback(async () => {
    try {
      setCounts(await fetchLandlordBadgeCounts());
    } catch (err) {
      console.error("useLandlordActionBadges:", err);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const markViewed = useCallback((category: ActionBadgeCategory) => {
    setCounts((prev) => ({ ...prev, [category]: 0 }));
    try {
      setBadgeLastViewed(category);
    } catch (err) {
      console.error("Error saving badge last-viewed timestamp:", err);
    }
  }, []);

  return { counts, markViewed, refresh };
}
