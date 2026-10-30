"use server";

import { createClient } from "@repo/supabase/server";
import type { Database } from "@repo/supabase";
import {
  CAMANAVA_CITIES,
  PETS,
  VEHICLE_OPTIONS,
} from "@repo/constants";

import {
  validateTenantPreferences,
  type TenantPreferences,
} from "@/lib/tenant-preferences";

export type SavePreferencesResult = { ok: true } | { ok: false; error: string };

// Persist the full tenant preferences object in one overwrite, mirroring
// the mobile save. Full replacement keeps saves idempotent: re-saving the
// same answers never duplicates anything.
export async function saveTenantPreferences(
  prefs: TenantPreferences,
): Promise<SavePreferencesResult> {
  const structuralError = validateTenantPreferences(prefs);
  if (structuralError) return { ok: false, error: structuralError };

  if (
    !prefs.selectedCities.every((city) =>
      (CAMANAVA_CITIES as readonly string[]).includes(city),
    )
  ) {
    return { ok: false, error: "Please choose valid cities." };
  }
  if (
    !prefs.kindOfPets.every((kind) =>
      (PETS as readonly string[]).includes(kind),
    ) ||
    !prefs.listOfVehicles.every((vehicle) =>
      (VEHICLE_OPTIONS as readonly string[]).includes(vehicle),
    )
  ) {
    return { ok: false, error: "Please choose valid options." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in to save your preferences." };

  const { data: profile } = await supabase
    .from("users")
    .select("id, roles")
    .eq("user_id", user.id)
    .maybeSingle<{ id: string; roles: string[] }>();
  if (!profile || !profile.roles.includes("tenant")) {
    return { ok: false, error: "Only tenant accounts can save rental preferences." };
  }

  type PreferencesColumn =
    Database["public"]["Tables"]["users"]["Update"]["preferences"];

  const { error } = await supabase
    .from("users")
    .update({ preferences: prefs as unknown as PreferencesColumn })
    .eq("user_id", user.id);
  if (error) {
    return { ok: false, error: "Couldn't save your preferences. Please try again." };
  }

  return { ok: true };
}
