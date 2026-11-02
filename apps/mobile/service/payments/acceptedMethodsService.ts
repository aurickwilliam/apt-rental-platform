import { supabase } from "@repo/supabase";
import {
  acceptedMethodsToRow,
  normalizeAcceptedMethods,
  validateAcceptedMethods,
  type PaymentMethod,
} from "@repo/utils";

// Tenant side: the methods the landlord of this tenancy accepts. Every method when the
// landlord has not limited them. The database function answers only for the caller's own
// tenancy, so tenants never read the landlord's settings table.
export async function fetchAcceptedMethodsForTenancy(tenancyId: string, signal?: AbortSignal): Promise<PaymentMethod[]> {
  const query = supabase.rpc("get_landlord_accepted_methods", { p_tenancy_id: tenancyId });
  if (signal) query.abortSignal(signal);
  const { data, error } = await query;
  if (error) throw error;
  return normalizeAcceptedMethods(data);
}

// Landlord side: their own setting. Method names only, no account numbers or credentials.
export async function fetchLandlordAcceptedMethods(landlordId: string, signal?: AbortSignal): Promise<PaymentMethod[]> {
  const query = supabase.from("landlord_payment_settings").select("accepted_methods").eq("landlord_id", landlordId);
  if (signal) query.abortSignal(signal);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return normalizeAcceptedMethods(data?.accepted_methods);
}

export async function saveLandlordAcceptedMethods(landlordId: string, methods: readonly PaymentMethod[]): Promise<PaymentMethod[]> {
  const invalid = validateAcceptedMethods(methods);
  if (invalid) throw new Error(invalid);
  const accepted_methods = acceptedMethodsToRow(methods);

  const { data: existing, error: lookupError } = await supabase.from("landlord_payment_settings")
    .select("landlord_id").eq("landlord_id", landlordId).maybeSingle();
  if (lookupError) throw lookupError;

  // Column-scoped grants: INSERT writes the owner and names, UPDATE only names and updated_at.
  const request = existing
    ? supabase.from("landlord_payment_settings").update({ accepted_methods, updated_at: new Date().toISOString() }).eq("landlord_id", landlordId)
    : supabase.from("landlord_payment_settings").insert({ landlord_id: landlordId, accepted_methods });
  const { data, error } = await request.select("accepted_methods").single();
  if (error) throw error;
  return normalizeAcceptedMethods(data.accepted_methods);
}

// Public read for an apartment page: the methods the listing's landlord accepts (every method
// when none is limited), or null when the listing is not publicly readable. Names only.
export async function fetchAcceptedMethodsForApartment(apartmentId: string, signal?: AbortSignal): Promise<PaymentMethod[] | null> {
  const query = supabase.rpc("get_apartment_accepted_methods", { p_apartment_id: apartmentId });
  if (signal) query.abortSignal(signal);
  const { data, error } = await query;
  if (error) throw error;
  return data === null ? null : normalizeAcceptedMethods(data);
}
