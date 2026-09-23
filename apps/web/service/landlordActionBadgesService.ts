"use client";

import { createClient } from "@repo/supabase/browser";

import { getLandlordContext } from "@/service/landlordApplicationsService";

export type ActionBadgeCategory = "maintenance" | "visits" | "applications";

export type ActionBadgeCounts = Record<ActionBadgeCategory, number>;

const STORAGE_PREFIX = "badge_last_viewed:";

export function getBadgeLastViewed(category: ActionBadgeCategory): string {
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    return new Date(0).toISOString();
  }
  return localStorage.getItem(STORAGE_PREFIX + category) ?? new Date(0).toISOString();
}

export function setBadgeLastViewed(category: ActionBadgeCategory): void {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_PREFIX + category, new Date().toISOString());
}

export async function fetchLandlordBadgeCounts(): Promise<ActionBadgeCounts> {
  const empty: ActionBadgeCounts = { maintenance: 0, visits: 0, applications: 0 };

  const context = await getLandlordContext();
  if (!context.landlordId) return empty;

  const supabase = createClient();

  const { data: apartments, error: apartmentsError } = await supabase
    .from("apartments")
    .select("id")
    .eq("landlord_id", context.landlordId)
    .is("deleted_at", null);

  if (apartmentsError) throw apartmentsError;

  const apartmentIds = (apartments ?? []).map((a) => a.id);
  if (apartmentIds.length === 0) return empty;

  const targets: { category: ActionBadgeCategory; table: "maintenance_request" | "visit_request" | "rental_application" }[] = [
    { category: "maintenance", table: "maintenance_request" },
    { category: "visits", table: "visit_request" },
    { category: "applications", table: "rental_application" },
  ];

  const results = await Promise.all(
    targets.map(async ({ category, table }) => {
      const { count, error } = await supabase
        .from(table)
        .select("id", { count: "exact", head: true })
        .in("apartment_id", apartmentIds)
        .eq("status", "pending")
        .gt("created_at", getBadgeLastViewed(category));
      if (error) throw error;
      return [category, count ?? 0] as const;
    }),
  );

  return Object.fromEntries(results) as ActionBadgeCounts;
}
