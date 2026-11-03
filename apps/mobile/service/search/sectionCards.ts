import type { ApartmentCardProps } from "@/components/cards/ApartmentCard";

// Section rows come from the batched RPC as untyped JSON with nullable columns,
// so this tolerates missing values; typed card queries use toApartmentCards.
export function transformApartments(data: any[]): ApartmentCardProps[] {
  return data.map((apt) => {
    const images = apt.apartment_images ?? [];
    const cover = images.find((img: any) => img.is_cover);
    const earliest = [...images].sort(
      (a: any, b: any) => new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime()
    )[0];
    const thumbnailUrl = (cover?.url_thumb || cover?.url) ?? (earliest?.url_thumb || earliest?.url) ?? undefined;
    return {
      id: apt.id,
      thumbnail: thumbnailUrl ? { uri: thumbnailUrl } : undefined,
      name: apt.name,
      location: `${apt.barangay}, ${apt.city}`,
      ratings: apt.average_rating?.toFixed(1) ?? "0.0",
      monthlyRent: apt.monthly_rent ?? 0,
      noBedroom: apt.no_bedrooms ?? 0,
      noBathroom: apt.no_bathrooms ?? 0,
      areaSqm: apt.area_sqm ?? 0,
      isVerified: apt.is_verified,
      isGrid: true,
    };
  });
}
