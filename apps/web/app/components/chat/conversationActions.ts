import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserReportReason } from "@repo/utils";

import type { ConversationPreferenceChange } from "@/lib/conversation-list";

/**
 * Conversation actions from the Messages list. Every call is a caller-bound
 * RPC (the database resolves the user from the session and validates the other
 * participant), so none of them sends the caller's own ID. Mirrors mobile's
 * `conversationActionsService`.
 */
export interface ConversationTarget {
  otherUserId: string;
  apartmentId: string | null;
}

export async function setConversationPreference(
  supabase: SupabaseClient,
  target: ConversationTarget,
  change: ConversationPreferenceChange
): Promise<void> {
  const { error } = await supabase.rpc("set_conversation_preference", {
    p_other_user_id: target.otherUserId,
    // The RPC treats null as "no apartment".
    p_apartment_id: target.apartmentId,
    p_pinned: change.isPinned,
    p_archived: change.isArchived,
    p_muted: change.isMuted,
    p_marked_unread: change.markedUnread,
  });
  if (error) throw error;
}

/** Marks the other user's messages read and clears a manual "mark unread". */
export async function markConversationRead(supabase: SupabaseClient, target: ConversationTarget): Promise<void> {
  const { error } = await supabase.rpc("mark_conversation_read", {
    p_other_user_id: target.otherUserId,
    p_apartment_id: target.apartmentId,
  });
  if (error) throw error;
}

export async function setUserBlocked(supabase: SupabaseClient, otherUserId: string, blocked: boolean): Promise<void> {
  const { error } = await supabase.rpc(blocked ? "block_user" : "unblock_user", { p_user_id: otherUserId });
  if (error) throw error;
}

export interface BlockStatus {
  blockedByMe: boolean;
  blockedMe: boolean;
}

/** Block state between the caller and one other user, in both directions (mobile's `getBlockStatus`). */
export async function getBlockStatus(supabase: SupabaseClient, otherUserId: string): Promise<BlockStatus> {
  const { data, error } = await supabase.rpc("get_block_status", { p_other_user_id: otherUserId });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return { blockedByMe: Boolean(row?.blocked_by_me), blockedMe: Boolean(row?.blocked_me) };
}

export async function reportUser(
  supabase: SupabaseClient,
  params: { target: ConversationTarget; reason: UserReportReason; details: string }
): Promise<void> {
  const details = params.details.trim();
  const { error } = await supabase.rpc("report_user", {
    p_reported_user_id: params.target.otherUserId,
    p_apartment_id: params.target.apartmentId,
    p_reason: params.reason,
    p_details: details || undefined,
  });
  if (error) throw error;
}
