"use server";

import { createClient } from "@repo/supabase/server";
import { revalidatePath } from "next/cache";
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

export async function setUserAccess(formData: FormData): Promise<OperationResult> {
  await requireAdmin();
  const parsed = input(formData);
  if (!("id" in parsed)) return parsed;
  const suspend = formData.get("decision");
  if (suspend !== "suspend" && suspend !== "reactivate") return { error: "Invalid decision." };

  const supabase = await createClient();
  const { data, error } = await supabase.functions.invoke("admin-user-access", {
    body: { targetId: parsed.id, suspend: suspend === "suspend", reason: parsed.reason },
  });
  if (error || data?.error) {
    console.error("Admin account access failed", error ?? data?.error);
    let message = typeof data?.error === "string" ? data.error : null;
    if (!message && error?.context instanceof Response) {
      try {
        const payload: unknown = await error.context.json();
        if (payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string") message = payload.error;
      } catch {
        // The Edge Function can return a non-JSON infrastructure error.
      }
    }
    return { error: message ?? "Account access could not be updated. Refresh and try again." };
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

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_apartment_visibility", {
    p_apartment_id: parsed.id, p_hide: decision === "hide", p_reason: parsed.reason,
  });
  if (error) {
    console.error("Admin listing visibility failed", error);
    return { error: "Listing visibility could not be updated. Refresh and try again." };
  }
  revalidatePath(`/admin/apartments/${parsed.id}`);
  revalidatePath("/admin/apartments");
  revalidatePath("/admin/activity");
  revalidatePath("/admin/analytics");
  revalidatePath("/browse");
  return {};
}
