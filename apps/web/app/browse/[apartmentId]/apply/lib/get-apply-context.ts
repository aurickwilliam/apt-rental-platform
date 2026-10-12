import type { createClient } from "@repo/supabase/server";

export type ApplyApartmentContext = {
  id: string;
  name: string | null;
  address: string | null;
  type: string | null;
  landlordId: string | null;
  landlordName: string | null;
  monthlyRent: number | null;
  securityDeposit: number | null;
  advanceRent: number | null;
  maxOccupants: number | null;
  floorLevel: string | null;
  furnishedType: string | null;
  leaseDuration: string | null;
};

type ServerClient = Awaited<ReturnType<typeof createClient>>;

export async function getApplyApartmentContext(
  supabase: ServerClient,
  apartmentId: string,
): Promise<ApplyApartmentContext | null> {
  const { data: apartment } = await supabase
    .from("apartments")
    .select("*")
    .eq("id", apartmentId)
    .eq("is_hidden_by_admin", false)
    .is("deleted_at", null)
    .single();

  if (!apartment) return null;

  let landlord: { id: string; first_name: string | null; last_name: string | null } | null = null;

  if (apartment?.landlord_id) {
    const { data } = await supabase
      .from("users")
      .select("id, first_name, last_name")
      .eq("id", apartment.landlord_id)
      .maybeSingle();
    landlord = data ?? null;
  }

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
    landlordId: (apartment.landlord_id as string | null) ?? landlord?.id ?? null,
    landlordName,
    monthlyRent: apartment.monthly_rent as number | null,
    securityDeposit: apartment.security_deposit as number | null,
    advanceRent: apartment.advance_rent as number | null,
    maxOccupants: apartment.max_occupants as number | null,
    floorLevel: apartment.floor_level as string | null,
    furnishedType: apartment.furnished_type as string | null,
    leaseDuration: apartment.lease_duration as string | null,
  };
}
