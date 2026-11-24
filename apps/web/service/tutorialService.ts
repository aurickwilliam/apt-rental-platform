import { createClient } from "@repo/supabase/browser";
import type { TutorialPortal, TutorialProgressRow } from "@repo/utils";

export type TutorialOutcome = "completed" | "skipped";

export interface TutorialState {
  progress: TutorialProgressRow | null;
  hasActiveTenancy: boolean;
}

/**
 * Saved tour progress for one portal and whether the account has a running
 * tenancy (it decides which steps are usable). RLS keeps the progress row
 * private to its owner; a failed tenancy read counts as "no tenancy".
 */
export async function fetchTutorialState(
  profileId: string,
  portal: TutorialPortal,
): Promise<TutorialState> {
  const supabase = createClient();
  const [progress, tenancies] = await Promise.all([
    supabase
      .from("tutorial_progress")
      .select("completed_at, skipped_at")
      .eq("user_id", profileId)
      .eq("portal", portal)
      .maybeSingle(),
    supabase
      .from("tenancies")
      .select("id")
      .eq(portal === "tenant" ? "tenant_id" : "landlord_id", profileId)
      .eq("status", "active")
      .limit(1),
  ]);

  if (progress.error) throw progress.error;
  return {
    progress: progress.data ?? null,
    hasActiveTenancy: !tenancies.error && (tenancies.data?.length ?? 0) > 0,
  };
}

/** Writes only this outcome's column, so skipping never erases a completion. */
export async function saveTutorialOutcome(
  profileId: string,
  portal: TutorialPortal,
  outcome: TutorialOutcome,
): Promise<TutorialProgressRow> {
  const now = new Date().toISOString();
  const stamp = outcome === "completed" ? { completed_at: now } : { skipped_at: now };
  const { data, error } = await createClient()
    .from("tutorial_progress")
    .upsert({ user_id: profileId, portal, ...stamp, updated_at: now }, { onConflict: "user_id,portal" })
    .select("completed_at, skipped_at")
    .single();

  if (error) throw error;
  return data;
}
