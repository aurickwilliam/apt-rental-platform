import { supabase } from "@repo/supabase";

/**
 * Conversation actions from the Messages list. Every call is a caller-bound
 * RPC: the database resolves the user from the session and validates the
 * other participant, so these never send the caller's own ID.
 */

export type ConversationTarget = {
  otherUserId: string;
  apartmentId: string | null;
};

export type ConversationPreferenceChange = {
  pinned?: boolean;
  archived?: boolean;
  muted?: boolean;
  markedUnread?: boolean;
};

/** Report reasons accepted by `report_user` (keep in sync with the DB check). */
export const USER_REPORT_REASONS = [
  { value: "spam", label: "Spam", description: "Unwanted or repeated messages" },
  { value: "scam", label: "Scam or fraud", description: "Asking for money, deposits or details outside APT" },
  { value: "harassment", label: "Harassment", description: "Threats, insults or bullying" },
  { value: "inappropriate", label: "Inappropriate content", description: "Offensive photos or messages" },
  { value: "fake_profile", label: "Fake profile or listing", description: "Pretending to be someone else, or a listing that isn't real" },
  { value: "other", label: "Something else", description: "Tell us what happened" },
] as const;

export type UserReportReason = (typeof USER_REPORT_REASONS)[number]["value"];

export const USER_REPORT_DETAILS_MAX_LENGTH = 1000;

export type BlockStatus = {
  blockedByMe: boolean;
  blockedMe: boolean;
};

export async function setConversationPreference(
  target: ConversationTarget,
  change: ConversationPreferenceChange
): Promise<void> {
  const { error } = await supabase.rpc("set_conversation_preference", {
    p_other_user_id: target.otherUserId,
    // The RPC treats null as "no apartment"; the generated type omits null.
    p_apartment_id: target.apartmentId as string,
    p_pinned: change.pinned,
    p_archived: change.archived,
    p_muted: change.muted,
    p_marked_unread: change.markedUnread,
  });
  if (error) throw error;
}

/** Marks the other user's messages read and clears a manual "mark unread". */
export async function markConversationRead(target: ConversationTarget): Promise<void> {
  const { error } = await supabase.rpc("mark_conversation_read", {
    p_other_user_id: target.otherUserId,
    p_apartment_id: target.apartmentId as string,
  });
  if (error) throw error;
}

export async function blockUser(otherUserId: string): Promise<void> {
  const { error } = await supabase.rpc("block_user", { p_user_id: otherUserId });
  if (error) throw error;
}

export async function unblockUser(otherUserId: string): Promise<void> {
  const { error } = await supabase.rpc("unblock_user", { p_user_id: otherUserId });
  if (error) throw error;
}

export async function getBlockStatus(otherUserId: string): Promise<BlockStatus> {
  const { data, error } = await supabase.rpc("get_block_status", {
    p_other_user_id: otherUserId,
  });
  if (error) throw error;

  const row = Array.isArray(data) ? data[0] : data;
  return {
    blockedByMe: Boolean(row?.blocked_by_me),
    blockedMe: Boolean(row?.blocked_me),
  };
}

export async function reportUser(params: {
  target: ConversationTarget;
  reason: UserReportReason;
  details: string;
}): Promise<void> {
  const details = params.details.trim();
  const { error } = await supabase.rpc("report_user", {
    p_reported_user_id: params.target.otherUserId,
    p_apartment_id: params.target.apartmentId as string,
    p_reason: params.reason,
    p_details: details || undefined,
  });
  if (error) throw error;
}
