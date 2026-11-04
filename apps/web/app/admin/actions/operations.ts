"use server";

import { createClient } from "@repo/supabase/server";
import { revalidatePath } from "next/cache";
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
  if (decision !== "warn" && decision !== "hide_listing" && decision !== "suspend_user")
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
    return { error: "The action could not be completed. Refresh and try again." };
  }
  revalidatePath("/admin/reports");
  revalidatePath("/admin/activity");
  revalidatePath("/admin/apartments");
  revalidatePath("/admin/users");
  return {};
}
