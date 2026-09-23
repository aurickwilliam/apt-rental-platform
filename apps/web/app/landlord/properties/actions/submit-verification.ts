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
  const { data: profile } = await supabase.from("users").select("id, role").eq("user_id", user.id).single();
  if (!profile || profile.role !== "landlord") return { error: "Only landlords can submit apartment verification." };
  const { error } = await supabase.from("apartment_verifications").insert({ apartment_id: apartmentId, landlord_id: profile.id });
  if (error) {
    console.error("Apartment verification submission failed", error);
    return { error: error.code === "23505" ? "This apartment already has a pending verification." : "Unable to submit this apartment for verification." };
  }
  revalidatePath("/landlord/properties");
  return {};
}
