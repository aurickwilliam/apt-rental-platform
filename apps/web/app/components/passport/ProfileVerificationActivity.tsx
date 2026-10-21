import { createClient } from "@repo/supabase/server";

import VerificationActivityTimeline from "./VerificationActivityTimeline";

/**
 * Secondary profile data: the latest verification submission for the
 * timeline. The profile card renders from the authoritative account_status
 * first; this streams into its slot, so it can never hold up the page.
 */
export default async function ProfileVerificationActivity({
  profileId,
}: {
  profileId: string;
}) {
  const supabase = await createClient();

  // Owners read only their own rows; absent when the user never submitted.
  const { data: verification, error } = await supabase
    .from("user_verifications")
    .select("status, submitted_at, reviewed_at, rejection_reason")
    .eq("user_id", profileId)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[profile] Failed to load verification activity:", error);
  }

  if (!verification) return null;

  return (
    <>
      <div className="border-t border-border" aria-hidden="true" />
      <VerificationActivityTimeline row={verification} />
    </>
  );
}
