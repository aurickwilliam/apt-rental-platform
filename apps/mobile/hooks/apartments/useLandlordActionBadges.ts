import { useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@repo/supabase";

export type ActionBadgeCategory = "maintenance" | "visits" | "applications";
export type ActionBadgeCounts = Record<ActionBadgeCategory, number>;

const STORAGE_PREFIX = "badge_last_viewed:";

const TABLE_MAP = {
  maintenance: "maintenance_request",
  visits: "visit_request",
  applications: "rental_application",
} as const;

async function getLastViewed(category: ActionBadgeCategory): Promise<string> {
  const stored = await AsyncStorage.getItem(STORAGE_PREFIX + category);
  return stored ?? new Date(0).toISOString();
}

export function useLandlordActionBadges() {
  const [counts, setCounts] = useState<ActionBadgeCounts>({
    maintenance: 0,
    visits: 0,
    applications: 0,
  });

  const fetchCounts = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("user_id", user.id)
        .single();
      if (userError || !userData) throw userError;

      const { data: aptData, error: aptError } = await supabase
        .from("apartments")
        .select("id")
        .eq("landlord_id", userData.id)
        .is("deleted_at", null);
      if (aptError) throw aptError;

      const apartmentIds = (aptData ?? []).map((a) => a.id);
      if (apartmentIds.length === 0) {
        setCounts({ maintenance: 0, visits: 0, applications: 0 });
        return;
      }

      const categories: ActionBadgeCategory[] = [
        "maintenance",
        "visits",
        "applications"
      ];

      const results = await Promise.all(
        categories.map(async (category) => {
          const lastViewed = await getLastViewed(category);
          const { count, error } = await supabase
            .from(TABLE_MAP[category])
            .select("id", { count: "exact", head: true })
            .in("apartment_id", apartmentIds)
            .eq("status", "pending")
            .gt("created_at", lastViewed);
          if (error) throw error;
          return [category, count ?? 0] as const;
        }),
      );

      setCounts(Object.fromEntries(results) as ActionBadgeCounts);
    } catch (err) {
      console.error("Error fetching landlord action badges:", err);
    }
  }, []);

  const markViewed = useCallback(async (category: ActionBadgeCategory) => {
    // Optimistic clear so the badge disappears instantly on tap
    setCounts((prev) => ({ ...prev, [category]: 0 }));
    try {
      await AsyncStorage.setItem(STORAGE_PREFIX + category, new Date().toISOString());
    } catch (err) {
      console.error("Error saving badge last-viewed timestamp:", err);
    }
  }, []);

  return { counts, fetchCounts, markViewed };
}
