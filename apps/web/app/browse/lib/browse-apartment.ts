export interface BrowseApartment {
  id: string;
  name: string;
  location: string;
  price: number;
  rating: number;
  isVerified: boolean;
  image: string;
  bedrooms?: number;
  bathrooms?: number;
  areaSqm?: number;
  /** Verified preference matches; set only on "Recommended for You" cards. */
  reasons?: string[];
}

/** Columns a Browse card needs; every card read selects exactly these. */
export const BROWSE_CARD_COLUMNS = `id, name, barangay, city, monthly_rent, average_rating,
  no_bedrooms, no_bathrooms, area_sqm, is_verified,
  apartment_images(url, url_thumb, is_cover, created_at)`;

export interface BrowseApartmentRow {
  id: string;
  name: string;
  barangay: string | null;
  city: string | null;
  monthly_rent: number;
  average_rating: number | null;
  no_bedrooms: number | null;
  no_bathrooms: number | null;
  area_sqm: number | null;
  is_verified: boolean | null;
  apartment_images?: { url: string | null; url_thumb: string | null; is_cover: boolean | null }[] | null;
}

// Row-to-card mapping shared by the paged list and the map viewport. Plain
// module (no server-only imports) so client components can use it too.
export function toBrowseApartment(apt: BrowseApartmentRow): BrowseApartment {
  return {
    id: apt.id,
    name: apt.name,
    location: [apt.barangay, apt.city].filter((v): v is string => Boolean(v)).join(", "),
    price: apt.monthly_rent,
    rating: apt.average_rating ?? 0,
    isVerified: apt.is_verified ?? false,
    // Cards render small: prefer the thumbnail tier, fall back to full-size.
    image:
      apt.apartment_images?.find((img) => img.is_cover)?.url_thumb ??
      apt.apartment_images?.find((img) => img.is_cover)?.url ??
      apt.apartment_images?.[0]?.url_thumb ??
      apt.apartment_images?.[0]?.url ??
      "/default/default-thumbnail.jpeg",
    bedrooms: apt.no_bedrooms ?? undefined,
    bathrooms: apt.no_bathrooms ?? undefined,
    areaSqm: apt.area_sqm ?? undefined,
  };
}
