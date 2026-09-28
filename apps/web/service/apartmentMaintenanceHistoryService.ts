"use client";

import { createClient } from "@repo/supabase/browser";

export const APARTMENT_MAINTENANCE_HISTORY_PREVIEW_LIMIT = 5;
export const APARTMENT_MAINTENANCE_HISTORY_PAGE_SIZE = 10;

export type ApartmentMaintenanceHistoryItem = {
  id: string;
  title: string;
  category: string;
  urgency: string;
  created_at: string;
  resolved_at: string | null;
  resolution_notes: string | null;
};

export type ApartmentMaintenanceHistoryResult = {
  items: ApartmentMaintenanceHistoryItem[];
  total: number;
};

type RpcRow = {
  id: string;
  title: string;
  category: string;
  urgency: string;
  created_at: string;
  resolved_at: string | null;
  resolution_notes: string | null;
  total_count: number | string | null;
};

export async function fetchApartmentMaintenanceHistory(
  apartmentId: string,
  limit: number = APARTMENT_MAINTENANCE_HISTORY_PAGE_SIZE,
  offset = 0,
): Promise<ApartmentMaintenanceHistoryResult> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("get_apartment_maintenance_history", {
    p_apartment_id: apartmentId,
    p_limit: limit,
    p_offset: offset,
  });

  if (error) throw error;

  const rows = (data ?? []) as unknown as RpcRow[];
  return {
    items: rows.map((row) => ({
      id: row.id,
      title: row.title,
      category: row.category,
      urgency: row.urgency,
      created_at: row.created_at,
      resolved_at: row.resolved_at,
      resolution_notes: row.resolution_notes,
    })),
    total: rows.length > 0 ? Number(rows[0]?.total_count ?? 0) : 0,
  };
}
