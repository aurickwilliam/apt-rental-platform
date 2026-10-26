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
  /** Raw city for recommendation scoring; not rendered directly. */
  city?: string;
  /** Raw amenity ids for recommendation scoring; absent when not selected. */
  amenities?: string[];
}

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
