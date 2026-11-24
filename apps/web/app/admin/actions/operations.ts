"use server";

import { createClient } from "@repo/supabase/server";
import { isAuthRateLimitError } from "@repo/utils";
import { revalidatePath } from "next/cache";
import { isAuthenticatorCode, parseAdminRoleDecision } from "@/lib/admin-role-change";
import { suspensionEnd } from "@/lib/suspension-duration";
import { requireAdmin } from "../_lib/require-admin";

export interface OperationResult {
  error?: string;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function input(formData: FormData): { id: string; reason: string } | OperationResult {
  const id = formData.get("id");
  const reason = formData.get("reason");
  if (typeof id !== "string" || !UUID.test(id)) return { error: "Invalid record." };
  if (typeof reason !== "string" || reason.trim().length < 3 || reason.length > 500)
    return { error: "Enter a reason between 3 and 500 characters." };
  return { id, reason: reason.trim() };
}

/** End of a suspension from the form's `duration`; null = permanent. */
function suspensionUntil(formData: FormData): { until: string | null } | OperationResult {
  const until = suspensionEnd(formData.get("duration"));
  if (until === undefined) return { error: "Choose how long the suspension lasts." };
  return { until };
}

export async function setUserAccess(formData: FormData): Promise<OperationResult> {
  await requireAdmin();
  const parsed = input(formData);
  if (!("id" in parsed)) return parsed;
  const suspend = formData.get("decision");
  if (suspend !== "suspend" && suspend !== "reactivate") return { error: "Invalid decision." };

  // The RPC authorizes the caller from auth.uid() and writes the audit row.
  const end = suspend === "suspend" ? suspensionUntil(formData) : { until: null };
  if (!("until" in end)) return end;
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_user_access", {
    p_target_id: parsed.id,
    p_suspend: suspend === "suspend",
    p_reason: parsed.reason,
    p_until: end.until ?? undefined,
  });
  if (error) {
    console.error("Admin account access failed", error);
    return { error: "Account access could not be updated. Refresh and try again." };
  }
  revalidatePath(`/admin/users/${parsed.id}`);
  revalidatePath("/admin/users");
  revalidatePath("/admin/activity");
  revalidatePath("/admin/analytics");
  return {};
}

/**
 * Admin access changes need a new authenticator code each time. The code is
 * checked first so the database sees a fresh `amr` entry on this same client's
 * session; the RPC repeats every other rule and writes the audit row.
 */
export async function setAdminRole(formData: FormData): Promise<OperationResult> {
  await requireAdmin();
  const parsed = input(formData);
  if (!("id" in parsed)) return parsed;
  const decision = parseAdminRoleDecision(formData.get("decision"));
  if (!decision) return { error: "Invalid decision." };
  const code = formData.get("code");
  if (!isAuthenticatorCode(code)) return { error: "Enter the 6-digit code from your authenticator app." };

  const supabase = await createClient();
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const factorIds = (factors?.totp ?? []).map((factor) => factor.id);
  if (!factorIds.length) {
    return { error: "Set up two-step login in Settings → Security before changing admin access." };
  }
  // Tries every verified device in turn, so a backup device works too.
  let verified = false;
  let rateLimited = false;
  for (const factorId of factorIds) {
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
    if (!error) {
      verified = true;
      break;
    }
    rateLimited ||= isAuthRateLimitError(error);
  }
  if (!verified) {
    return {
      error: rateLimited
        ? "Too many attempts. Wait a few minutes and try again."
        : "That code is incorrect or has expired. Enter a new one.",
    };
  }

  const { error } = await supabase.rpc(
    decision === "grant" ? "admin_grant_admin_role" : "admin_revoke_admin_role",
    { p_target_id: parsed.id, p_reason: parsed.reason },
  );
  if (error) {
    console.error("Admin role change failed", error);
    // Our own `raise exception` messages (SQLSTATE P0001) are written for admins.
    if (error.code === "P0001" && error.message) return { error: error.message };
    return { error: "Admin access could not be updated. Refresh and try again." };
  }
  revalidatePath(`/admin/users/${parsed.id}`);
  revalidatePath("/admin/users");
  revalidatePath("/admin/activity");
  return {};
}

export async function setApartmentVisibility(formData: FormData): Promise<OperationResult> {
  await requireAdmin();
  const parsed = input(formData);
  if (!("id" in parsed)) return parsed;
  const decision = formData.get("decision");
  if (decision !== "hide" && decision !== "restore") return { error: "Invalid decision." };

  // The RPC authorizes the caller from auth.uid() and writes the audit row.
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_apartment_visibility", {
    p_apartment_id: parsed.id,
    p_hide: decision === "hide",
    p_reason: parsed.reason,
  });
  if (error) {
    console.error("Admin listing visibility failed", error);
    return { error: "Listing visibility could not be updated. Refresh and try again." };
  }
  revalidatePath(`/admin/apartments/${parsed.id}`);
  revalidatePath("/admin/apartments");
  revalidatePath("/admin/activity");
  revalidatePath("/admin/analytics");
  return {};
}

export async function resolveUserReport(formData: FormData): Promise<OperationResult> {
  await requireAdmin();
  const parsed = input(formData);
  if (!("id" in parsed)) return parsed;
  const decision = formData.get("decision");
  if (decision !== "resolve" && decision !== "dismiss") return { error: "Invalid decision." };

  // The RPC authorizes the caller from auth.uid() and writes the audit row.
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_resolve_user_report", {
    p_report_id: parsed.id,
    p_status: decision === "resolve" ? "resolved" : "dismissed",
    p_note: parsed.reason,
  });
  if (error) {
    console.error("Admin report review failed", error);
    return { error: "The report could not be updated. Refresh and try again." };
  }
  revalidatePath("/admin/reports");
  revalidatePath("/admin/activity");
  return {};
}

export async function actOnUserReport(formData: FormData): Promise<OperationResult> {
  await requireAdmin();
  const parsed = input(formData);
  if (!("id" in parsed)) return parsed;
  const decision = formData.get("decision");
  if (
    decision !== "warn" &&
    decision !== "hide_listing" &&
    decision !== "suspend_user" &&
    decision !== "restore_listing" &&
    decision !== "keep_hidden"
  )
    return { error: "Invalid decision." };

  const end = decision === "suspend_user" ? suspensionUntil(formData) : { until: null };
  if (!("until" in end)) return end;

  // One audited transaction: warn, hide the listing or suspend the account, and close the report.
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_act_on_report", {
    p_report_id: parsed.id,
    p_action: decision,
    p_note: parsed.reason,
    p_until: end.until ?? undefined,
  });
  if (error) {
    console.error("Admin report action failed", error);
    // Our own `raise exception` messages (SQLSTATE P0001) are written for admins; show them.
    if (error.code === "P0001" && error.message) {
      return {
        error:
          error.message === "Invalid account access transition."
            ? "This account can't be suspended. Admin accounts, your own account and accounts that are already suspended are off limits."
            : error.message,
      };
    }
    return { error: "The action could not be completed. Refresh and try again." };
  }
  revalidatePath("/admin/reports");
  revalidatePath("/admin/activity");
  revalidatePath("/admin/apartments");
  revalidatePath("/admin/users");
  return {};
}
