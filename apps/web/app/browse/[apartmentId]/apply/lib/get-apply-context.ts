import type { createClient } from "@repo/supabase/server";

export type ApplyApartmentContext = {
  id: string;
  name: string | null;
  address: string | null;
  type: string | null;
  cover: string;
  images: string[];
  landlordId: string | null;
  landlordName: string | null;
  landlordAvatarUrl: string | null;
  monthlyRent: number | null;
  securityDeposit: number | null;
  advanceRent: number | null;
  maxOccupants: number | null;
  noBedrooms: number | null;
  noBathrooms: number | null;
  areaSqm: number | null;
  floorLevel: string | null;
  furnishedType: string | null;
  leaseDuration: string | null;
  averageRating: number | null;
};

type ServerClient = Awaited<ReturnType<typeof createClient>>;

export async function getApplyApartmentContext(
  supabase: ServerClient,
  apartmentId: string,
): Promise<ApplyApartmentContext | null> {
  const { data: apartment } = await supabase
    .from("apartments")
    .select(
      `
      *,
      apartment_images(url, is_cover)
    `,
    )
    .eq("id", apartmentId)
    .eq("is_hidden_by_admin", false)
    .is("deleted_at", null)
    .single();

  if (!apartment) return null;

  let landlord: { id: string; first_name: string | null; last_name: string | null; avatar_url: string | null } | null = null;

  if (apartment?.landlord_id) {
    const { data } = await supabase
      .from("users")
      .select("id, first_name, last_name, avatar_url")
      .eq("id", apartment.landlord_id)
      .maybeSingle();
    landlord = data ?? null;
  }

  const images: string[] =
    apartment.apartment_images?.map((img: { url: string }) => img.url) ?? [
      "/default/default-thumbnail.jpeg",
    ];

  const cover =
    apartment.apartment_images?.find((img: { is_cover: boolean | null }) => img.is_cover)?.url ?? images[0];

  const fullAddress = [
    apartment.street_address,
    apartment.barangay,
    apartment.city,
    apartment.province,
    apartment.zip_code,
  ]
    .filter(Boolean)
    .join(", ");

  const landlordName = [landlord?.first_name, landlord?.last_name].filter(Boolean).join(" ") || null;

  return {
    id: apartment.id as string,
    name: apartment.name as string | null,
    address: fullAddress || null,
    type: apartment.type as string | null,
    cover,
    images,
    landlordId: (apartment.landlord_id as string | null) ?? landlord?.id ?? null,
    landlordName,
    landlordAvatarUrl: landlord?.avatar_url ?? null,
    monthlyRent: apartment.monthly_rent as number | null,
    securityDeposit: apartment.security_deposit as number | null,
    advanceRent: apartment.advance_rent as number | null,
    maxOccupants: apartment.max_occupants as number | null,
    noBedrooms: apartment.no_bedrooms as number | null,
    noBathrooms: apartment.no_bathrooms as number | null,
    areaSqm: apartment.area_sqm as number | null,
    floorLevel: apartment.floor_level as string | null,
    furnishedType: apartment.furnished_type as string | null,
    leaseDuration: apartment.lease_duration as string | null,
    averageRating: apartment.average_rating as number | null,
  };
}
