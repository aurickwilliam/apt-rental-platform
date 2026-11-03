"use client";

import { createClient } from "@repo/supabase/browser";
import {
  acceptedMethodsToRow,
  normalizeAcceptedMethods,
  validateAcceptedMethods,
  type PaymentMethod,
} from "@repo/utils";

// Web twin of mobile service/payments/acceptedMethodsService.ts. Method names only: no
// account numbers or credentials are ever stored.

/** Tenant side: methods the landlord of this tenancy accepts (all of them when none are limited). */
export async function fetchAcceptedMethodsForTenancy(tenancyId: string): Promise<PaymentMethod[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_landlord_accepted_methods", { p_tenancy_id: tenancyId });
  if (error) throw error;
  return normalizeAcceptedMethods(data);
}

/** Landlord side: their own setting. */
export async function fetchLandlordAcceptedMethods(landlordId: string): Promise<PaymentMethod[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("landlord_payment_settings")
    .select("accepted_methods")
    .eq("landlord_id", landlordId)
    .maybeSingle();
  if (error) throw error;
  return normalizeAcceptedMethods(data?.accepted_methods);
}

export async function saveLandlordAcceptedMethods(
  landlordId: string,
  methods: readonly PaymentMethod[],
): Promise<PaymentMethod[]> {
  const invalid = validateAcceptedMethods(methods);
  if (invalid) throw new Error(invalid);
  const accepted_methods = acceptedMethodsToRow(methods);
  const supabase = createClient();

  const { data: existing, error: lookupError } = await supabase
    .from("landlord_payment_settings")
    .select("landlord_id")
    .eq("landlord_id", landlordId)
    .maybeSingle();
  if (lookupError) throw lookupError;

  // Column-scoped grants: INSERT writes the owner and names, UPDATE only names and updated_at.
  const request = existing
    ? supabase
        .from("landlord_payment_settings")
        .update({ accepted_methods, updated_at: new Date().toISOString() })
        .eq("landlord_id", landlordId)
    : supabase.from("landlord_payment_settings").insert({ landlord_id: landlordId, accepted_methods });
  const { data, error } = await request.select("accepted_methods").single();
  if (error) throw error;
  return normalizeAcceptedMethods(data.accepted_methods);
}
