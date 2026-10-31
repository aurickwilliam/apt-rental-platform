import { type ApartmentCardProps } from "@/components/cards/ApartmentCard";

// Columns an apartment search card needs. Shared by the search tab and Ava,
// the chatbot search, so both show the same card for the same listing.
export const APARTMENT_CARD_SELECT = `
  id,
  name,
  barangay,
  city,
  average_rating,
  monthly_rent,
  no_bedrooms,
  no_bathrooms,
  area_sqm,
  is_verified,
  apartment_images (
    url,
    url_thumb,
    is_cover,
    created_at
  )
`;

interface ApartmentCardImageRow {
  url: string | null;
  url_thumb: string | null;
  is_cover: boolean | null;
  created_at: string | null;
}

export interface ApartmentCardRow {
  id: string;
  name: string;
  barangay: string | null;
  city: string | null;
  average_rating: number | null;
  monthly_rent: number;
  no_bedrooms: number;
  no_bathrooms: number;
  area_sqm: number;
  is_verified: boolean;
  apartment_images: ApartmentCardImageRow[] | null;
}

// Cover image first, otherwise the oldest upload; thumbnails before full size.
function pickThumbnail(images: ApartmentCardImageRow[]): string | undefined {
  const cover = images.find((img) => img.is_cover);
  const earliest = images
    .slice()
    .sort(
      (a, b) =>
        new Date(a.created_at ?? 0).getTime() -
        new Date(b.created_at ?? 0).getTime(),
    )[0];
  return (
    (cover?.url_thumb || cover?.url) ??
    (earliest?.url_thumb || earliest?.url) ??
    undefined
  );
}

export function toApartmentCards(rows: ApartmentCardRow[]): ApartmentCardProps[] {
  return rows.map((apt) => {
    const thumbnailUrl = pickThumbnail(apt.apartment_images ?? []);

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
      isVerified: apt.is_verified,
      isGrid: true,
    };
  });
}
