"use client";

import { useCallback } from "react";

import { useAsyncResource } from "@/hooks/use-async-resource";
import {
  fetchLandlordBadgeCounts,
  setBadgeLastViewed,
  type ActionBadgeCategory,
  type ActionBadgeCounts,
} from "@/service/landlordActionBadgesService";

export type { ActionBadgeCategory, ActionBadgeCounts };

const EMPTY_COUNTS: ActionBadgeCounts = { maintenance: 0, visits: 0, applications: 0 };

export function useLandlordActionBadges() {
  const load = useCallback(() => fetchLandlordBadgeCounts(), []);
  const { data: counts, refresh, setData } = useAsyncResource(load, EMPTY_COUNTS, "useLandlordActionBadges:");

  const markViewed = useCallback(
    (category: ActionBadgeCategory) => {
      setData((prev) => ({ ...prev, [category]: 0 }));
      try {
        setBadgeLastViewed(category);
      } catch (err) {
        console.error("Error saving badge last-viewed timestamp:", err);
      }
    },
    [setData],
  );

  return { counts, markViewed, refresh };
}
