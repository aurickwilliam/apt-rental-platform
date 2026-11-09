import { supabase } from "@repo/supabase";

import type { Portal } from "./portalPreference";

export const INCOMPLETE_PROFILE_DB_MESSAGE = "Complete your profile before adding a role.";
export const INCOMPLETE_PROFILE_MESSAGE =
  "Please complete your profile (including your mobile number) before adding a role.";
export const ADD_ROLE_FALLBACK_MESSAGE =
  "We couldn't add that role to your account. Please try again. If this persists, contact support.";

// Only known, user-actionable database messages reach the screen; anything
// else (constraint names, SQL internals) becomes the generic fallback.
export function getAddRoleErrorMessage(error: unknown): string {
  const message = typeof error === "object" && error !== null && "message" in error
    ? (error as { message?: unknown }).message
    : undefined;
  return message === INCOMPLETE_PROFILE_DB_MESSAGE ? INCOMPLETE_PROFILE_MESSAGE : ADD_ROLE_FALLBACK_MESSAGE;
}

// Self-service second-role grant for the signed-in account. The database
// function `grant_user_role` is the authority: it checks the caller, requires a
// completed profile and only ever appends tenant or landlord. Returns the
// account's roles after the grant.
export async function grantRole(role: Portal): Promise<string[]> {
  const { data, error } = await supabase.rpc("grant_user_role", { new_role: role });
  if (error) {
    console.error("Could not add role", { code: error.code, message: error.message });
    throw new Error(getAddRoleErrorMessage(error));
  }
  return data ?? [];
}
