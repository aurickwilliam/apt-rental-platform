"use client";

import { createClient } from "@repo/supabase/browser";
import type { Database } from "@repo/supabase";
import { FAVORITES_PRESENTATION_LIMIT, invalidateFavoritePresentation, type FavoriteCursor, type FavoritePresentation } from "@/lib/favorite-resource";

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
  apartment_images: Pick<ApartmentImageRow, "url" | "url_thumb" | "is_cover" | "created_at">[] | null;
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

  if (authError) {
    if (authError.name === "AuthSessionMissingError") {
      return { tenantId: null, role: null, isAuthenticated: false };
    }
    throw authError;
  }
  if (!user) {
    return { tenantId: null, role: null, isAuthenticated: false };
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("id, roles")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) throw profileError;

  const typedProfile = profile as unknown as { id: string; roles: string[] } | null;
  const roles = typedProfile?.roles ?? [];
  const role = roles.includes("tenant") ? "tenant" : null;
  const tenantId = role === "tenant" ? typedProfile?.id ?? null : null;

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

  invalidateFavoritePresentation(tenantId);
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
  invalidateFavoritePresentation(tenantId, apartmentId);
}

/** Bounded shortlist presentation only; never used for listing/rental decisions. */
export async function fetchFavoritePresentation(tenantId: string, cursor: FavoriteCursor | null): Promise<FavoritePresentation> {
  const supabase = createClient();
  let query = supabase.from("favorites")
    .select("apartment_id, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false, nullsFirst: false })
    .order("apartment_id", { ascending: true })
    .limit(FAVORITES_PRESENTATION_LIMIT + 1);
  if (cursor) {
    query = cursor.createdAt === null
      ? query.is("created_at", null).gt("apartment_id", cursor.apartmentId)
      : query.or(`created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},apartment_id.gt.${cursor.apartmentId}),created_at.is.null`);
  }
  const { data: favorites, error } = await query;
  if (error) throw error;
  const page = (favorites ?? []).slice(0, FAVORITES_PRESENTATION_LIMIT);
  const last = page.at(-1);
  const nextCursor = (favorites?.length ?? 0) > FAVORITES_PRESENTATION_LIMIT && last
    ? { createdAt: last.created_at, apartmentId: last.apartment_id } : null;
  const ids = [...new Set(page.map((row) => row.apartment_id))];
  if (!ids.length) return { apartments: [], nextCursor };
  const { data: apartments, error: apartmentError } = await supabase.from("apartments")
    .select("id, name, barangay, city, average_rating, monthly_rent, no_bedrooms, no_bathrooms, area_sqm, apartment_images(url, url_thumb, is_cover, created_at)")
    .is("deleted_at", null)
    .eq("is_hidden_by_admin", false)
    .in("id", ids)
    .order("is_cover", { referencedTable: "apartment_images", ascending: false, nullsFirst: false })
    .order("created_at", { referencedTable: "apartment_images", ascending: true })
    .order("id", { referencedTable: "apartment_images", ascending: true })
    .limit(1, { referencedTable: "apartment_images" });
  if (apartmentError) throw apartmentError;
  const byId = new Map((apartments ?? []).map((row) => [row.id, row]));
  return { apartments: ids.flatMap((id) => {
    const apartment = byId.get(id);
    return apartment ? [apartment] : [];
  }) as FavoriteApartment[], nextCursor };
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
    .eq("is_hidden_by_admin", false)
    .in("id", apartmentIds);

  if (error) throw error;

  return (data ?? []) as FavoriteApartment[];
}
