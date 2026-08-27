import { createClient } from "@repo/supabase/server";
import ApplyClient from "./components/ApplyClient";

export default async function ApplyPage({ params }: { params: Promise<{ apartmentId: string }> }) {
  const { apartmentId } = await params;
  const supabase = await createClient();

  const { data: apartment } = await supabase
    .from("apartments")
    .select(
      `
      *,
      apartment_images(url, is_cover)
    `
    )
    .eq("id", apartmentId)
    .single();

  let landlord: { first_name: string | null; last_name: string | null; avatar_url: string | null } | null = null;

  if (apartment?.landlord_id) {
    const { data } = await supabase
      .from("users")
      .select("first_name, last_name, avatar_url")
      .eq("id", apartment.landlord_id)
      .maybeSingle();
    landlord = data ?? null;
  }

  if (!apartment) {
    return (
      <div className="max-w-3xl mx-auto p-4 py-12 text-center">
        <h1 className="text-2xl font-semibold">Apartment not found</h1>
        <p className="text-grey-700 mt-2">The listing you are trying to apply for does not exist.</p>
      </div>
    );
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

  const apartmentContext = {
    id: apartment.id as string,
    name: apartment.name as string | null,
    address: fullAddress || null,
    type: apartment.type as string | null,
    cover,
    images,
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

  return <ApplyClient apartment={apartmentContext} />;
}
