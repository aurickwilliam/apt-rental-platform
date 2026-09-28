"use server";

import { createClient } from "@repo/supabase/server";
import { revalidatePath } from "next/cache";

export interface SubmitApartmentVerificationResult {
  error?: string;
}

export async function submitApartmentVerification(apartmentId: string): Promise<SubmitApartmentVerificationResult> {
  if (!/^[0-9a-f-]{36}$/i.test(apartmentId)) return { error: "Invalid apartment." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in again." };
  const { data: profileData } = await supabase.from("users").select("id, roles").eq("user_id", user.id).single();
  const profile = profileData as unknown as { id: string; roles: string[] } | null;
  if (!profile?.roles.includes("landlord")) return { error: "Only landlords can submit apartment verification." };
  const { error } = await supabase.from("apartment_verifications").insert({ apartment_id: apartmentId, landlord_id: profile.id });
  if (error) {
    console.error("Apartment verification submission failed", error);
    return { error: error.code === "23505" ? "This apartment already has a pending verification." : "Unable to submit this apartment for verification." };
  }
  revalidatePath("/landlord/properties");
  return {};
}
