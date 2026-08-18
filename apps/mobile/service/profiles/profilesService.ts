import { Image as RNImage } from "react-native";
import { supabase } from "@repo/supabase";

import { DEFAULT_IMAGES } from "constants/images";

import type { ApartmentCardProps } from "components/cards/ApartmentCard";

export type LandlordProfileData = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  mobile_number: string | null;
  avatar_url: string | null;
  background_url: string | null;
  account_status: string | null;
  street_address: string | null;
  barangay: string | null;
  city: string | null;
  province: string | null;
  created_at: string | null;
};

export type PublicLandlordProfileResult = {
  profile: LandlordProfileData | null;
  listings: ApartmentCardProps[];
};

export async function fetchPublicLandlordProfile(
  landlordId: string
): Promise<PublicLandlordProfileResult> {
  let profile: LandlordProfileData | null = null;
  let listings: ApartmentCardProps[] = [];

  const { data: profileData, error: profileError } = await supabase
    .from("users")
    .select(
      "id, first_name, last_name, email, mobile_number, avatar_url, background_url, account_status, street_address, barangay, city, province, created_at"
    )
    .eq("id", landlordId)
    .returns<LandlordProfileData>()
    .single();

  if (profileError) {
    console.error("Error fetching landlord profile:", profileError);
  } else {
    profile = profileData;
  }

  const { data: aptData, error: aptError } = await supabase
    .from("apartments")
    .select(
      `
        id,
        name,
        monthly_rent,
        no_bedrooms,
        no_bathrooms,
        area_sqm,
        average_rating,
        barangay,
        city,
        apartment_images (
          url,
          url_thumb,
          is_cover,
          created_at
        )
      `
    )
    .eq("landlord_id", landlordId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (aptError) {
    console.error("Error fetching landlord listings:", aptError);
  } else {
    listings = ((aptData ?? []) as unknown as {
      id: string;
      name: string;
      monthly_rent: number;
      no_bedrooms: number;
      no_bathrooms: number;
      area_sqm: number;
      average_rating: number | null;
      barangay: string;
      city: string;
      apartment_images: { url: string; url_thumb: string | null; is_cover: boolean | null; created_at: string | null }[];
    }[]).map((apt): ApartmentCardProps => {
      const images = apt.apartment_images ?? [];
      const cover = images.find((img) => img.is_cover);
      const earliest = images
        .slice()
        .sort(
          (a, b) =>
            new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime()
        )[0];
      const thumbnailUrl =
        (cover?.url_thumb || cover?.url) ??
        (earliest?.url_thumb || earliest?.url) ??
        undefined;

      return {
        id: apt.id,
        thumbnail: thumbnailUrl ? { uri: thumbnailUrl } : undefined,
        name: apt.name,
        location: `${apt.barangay}, ${apt.city}`,
        ratings: apt.average_rating?.toFixed(1) ?? "0.0",
        monthlyRent: apt.monthly_rent,
        noBedroom: apt.no_bedrooms,
        noBathroom: apt.no_bathrooms,
        areaSqm: apt.area_sqm,
        isFavorite: false,
        isGrid: true,
      };
    });
  }

  return { profile, listings };
}

export function formatMonth(isoDate: string | null): string {
  if (!isoDate) return "—";
  return new Date(isoDate).toLocaleString("default", { month: "long" });
}

export function formatYear(isoDate: string | null): string {
  if (!isoDate) return "—";
  return String(new Date(isoDate).getFullYear());
}

export type PublicTenantProfile = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  location: string;
  memberSinceYear: string;
  isVerified: boolean;
  avatarUrl: string | null;
  reviewsCount: number;
};

export type PastApartment = {
  id: string;
  name: string;
  city: string;
  barangay: string;
  leaseStartMonth: string;
  leaseStartYear: string;
  leaseEndMonth: string;
  leaseEndYear: string;
  thumbnailUrl: string;
};

export type PublicTenantProfileResult = {
  profile: PublicTenantProfile | null;
  pastApartments: PastApartment[];
};

type TenantUserRow = {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  mobile_number: string | null;
  avatar_url: string | null;
  created_at: string | null;
  city: string | null;
  province: string | null;
  account_status: string | null;
};

export async function fetchPublicTenantProfile(
  tenantId: string
): Promise<PublicTenantProfileResult> {
  try {
    const { data: userRow, error: userError } = await supabase
      .from("users")
      .select(`
        first_name,
        last_name,
        email,
        mobile_number,
        avatar_url,
        created_at,
        city,
        province,
        account_status
      `)
      .eq("id", tenantId)
      .single();

    if (userError) throw userError;

    const user = userRow as unknown as TenantUserRow;

    const { count: reviewCount } = await supabase
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId);

    const location = [user.city, user.province].filter(Boolean).join(", ") || "—";

    const profile: PublicTenantProfile = {
      id: tenantId,
      fullName: `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || "Tenant",
      email: user.email ?? "—",
      phoneNumber: user.mobile_number ?? "—",
      location,
      memberSinceYear: user.created_at
        ? String(new Date(user.created_at).getFullYear())
        : "—",
      isVerified: user.account_status === "verified",
      avatarUrl: user.avatar_url ?? null,
      reviewsCount: reviewCount ?? 0,
    };

    const { data: tenancies } = await supabase
      .from("tenancies")
      .select(`
        id,
        lease_start,
        lease_end,
        apartment:apartments!tenancies_apartment_id_fkey (
          id,
          name,
          barangay,
          city,
          apartment_images (url, url_thumb, is_cover)
        )
      `)
      .eq("tenant_id", tenantId)
      .in("status", ["ended"])
      .order("lease_end", { ascending: false });

    const pastApartments: PastApartment[] = ((tenancies ?? []) as unknown as {
      id: string;
      lease_start: string | null;
      lease_end: string | null;
      apartment: {
        id: string;
        name: string;
        barangay: string;
        city: string;
        apartment_images: { url: string; url_thumb: string | null; is_cover: boolean | null }[];
      } | null;
    }[]).map((t) => {
      const apt = t.apartment ?? { id: "", name: "", barangay: "", city: "", apartment_images: [] };

      const images = apt.apartment_images ?? [];
      const cover = images.find((img) => img.is_cover) ?? images[0];
      const thumbnailUrl =
        (cover?.url_thumb || cover?.url) ??
        RNImage.resolveAssetSource(DEFAULT_IMAGES.defaultThumbnail).uri;

      return {
        id: t.id,
        name: apt.name,
        city: apt.city,
        barangay: apt.barangay,
        leaseStartMonth: formatMonth(t.lease_start),
        leaseStartYear: formatYear(t.lease_start),
        leaseEndMonth: formatMonth(t.lease_end),
        leaseEndYear: formatYear(t.lease_end),
        thumbnailUrl,
      };
    });

    return { profile, pastApartments };
  } catch (err) {
    console.error("Error fetching tenant profile:", err);
    return { profile: null, pastApartments: [] };
  }
}