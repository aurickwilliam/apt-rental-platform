import { useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useCurrentUser } from "@/hooks/auth";
import { fetchLandlordBadges } from "@/service/landlordService";

export type { ActionBadgeCategory, ActionBadgeCounts } from "@/service/landlordService";

const STORAGE_PREFIX = "badge_last_viewed:";

const EMPTY_COUNTS = { maintenance: 0, visits: 0, applications: 0 };

export const getLandlordBadgesQueryKey = (landlordId: string | null) =>
  ["landlord-badges", landlordId] as const;

export function useLandlordActionBadges() {
  const queryClient = useQueryClient();
  const currentUserQuery = useCurrentUser();
  const landlordId = currentUserQuery.data?.id ?? null;

  const queryKey = getLandlordBadgesQueryKey(landlordId);

  const countsQuery = useQuery({
    queryKey,
    queryFn: () => fetchLandlordBadges(landlordId as string),
    enabled: landlordId !== null,
  });

  const counts = countsQuery.data ?? EMPTY_COUNTS;

  const markViewed = useCallback(
    async (category: "maintenance" | "visits" | "applications") => {
      // Optimistic clear so the badge disappears instantly on tap
      queryClient.setQueryData(queryKey, (current) => ({
        ...(current ?? EMPTY_COUNTS),
        [category]: 0,
      }));
      try {
        await AsyncStorage.setItem(STORAGE_PREFIX + category, new Date().toISOString());
      } catch (err) {
        console.error("Error saving badge last-viewed timestamp:", err);
      }
    },
    [queryClient, queryKey]
  );

  return { counts, fetchCounts: countsQuery.refetch, markViewed };
}