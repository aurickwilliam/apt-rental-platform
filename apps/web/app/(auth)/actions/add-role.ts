"use server";

import { redirect } from "next/navigation";
import { createClient } from "@repo/supabase/server";

export type AddRoleState = {
  error?: string;
};

// Self-service second-role grant: appends tenant/landlord to the caller's
// roles via the grant_user_role RPC (which enforces completeness and
// rejects admin). On success, lands in the new role's portal.
export async function addRole(
  _: AddRoleState,
  formData: FormData
): Promise<AddRoleState> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return { error: "Unauthorized." };

  const requested = formData.get("role");
  if (requested !== "tenant" && requested !== "landlord") {
    return { error: "Please choose a valid account type." };
  }

  const { error } = await supabase.rpc("grant_user_role", {
    new_role: requested,
  });

  if (error) {
    console.error("add-role: grant failed", {
      code: error.code,
      message: error.message,
    });
    return {
      error:
        "We couldn't add that role to your account. Please try again — if this persists, contact support.",
    };
  }

  redirect(
    requested === "landlord" ? "/landlord/dashboard" : "/tenant/my-rental"
  );
}
