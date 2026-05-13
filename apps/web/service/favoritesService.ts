"use client";

import { createClient } from "@repo/supabase/browser";
import type { Database } from "@repo/supabase";

type FavoriteRow = Database["public"]["Tables"]["favorites"]["Row"];
type ApartmentImageRow = Database["public"]["Tables"]["apartment_images"]["Row"];
type ApartmentRow = Database["public"]["Tables"]["apartments"]["Row"];

export type FavoriteApartment = Pick<
  ApartmentRow,
  | "id"
  | "name"
  | "barangay"
  | "city"
  | "average_rating"
  | "monthly_rent"
  | "no_bedrooms"
  | "no_bathrooms"
  | "area_sqm"
> & {
  apartment_images: Pick<ApartmentImageRow, "url" | "is_cover" | "created_at">[] | null;
};

export type TenantContext = {
  tenantId: string | null;
  role: string | null;
  isAuthenticated: boolean;
};

export async function getTenantContext(): Promise<TenantContext> {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw authError;
  if (!user) {
    return { tenantId: null, role: null, isAuthenticated: false };
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) throw profileError;

  const role = profile?.role ?? null;
  const tenantId = role === "tenant" ? profile?.id ?? null : null;

  return { tenantId, role, isAuthenticated: true };
}

export async function fetchFavoriteApartmentIds(tenantId: string): Promise<string[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("favorites")
    .select("apartment_id, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => row.apartment_id);
}

export async function insertFavorite(
  tenantId: string,
  apartmentId: string,
): Promise<FavoriteRow> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("favorites")
    .insert({
      tenant_id: tenantId,
      apartment_id: apartmentId,
    })
    .select("*")
    .single();

  if (error) throw error;

  return data;
}

export async function deleteFavorite(tenantId: string, apartmentId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("apartment_id", apartmentId);

  if (error) throw error;
}

export async function fetchApartmentsByIds(apartmentIds: string[]): Promise<FavoriteApartment[]> {
  if (apartmentIds.length === 0) return [];

  const supabase = createClient();

  const { data, error } = await supabase
    .from("apartments")
    .select(
      `
        id,
        name,
        barangay,
        city,
        average_rating,
        monthly_rent,
        no_bedrooms,
        no_bathrooms,
        area_sqm,
        apartment_images (
          url,
          is_cover,
          created_at
        )
      `,
    )
    .is("deleted_at", null)
    .in("id", apartmentIds);

  if (error) throw error;

  return (data ?? []) as FavoriteApartment[];
}
