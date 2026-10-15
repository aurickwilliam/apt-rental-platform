import type { SupabaseClient } from "@supabase/supabase-js";

import type { ChatMessage, MessageReaction, ReplyPreview } from "./types";

/**
 * Chat persistence helpers shared by the tenant and landlord conversation
 * views. Mirrors the mobile equivalents in
 * `apps/mobile/service/chat/chatService.ts` so both platforms write the same
 * rows to the same tables.
 */

// ─── Reactions ───────────────────────────────────────────────────────────────
// One reaction per user per message: the `chat_reactions` primary key is
// (message_id, user_id), so upserting a different emoji replaces the user's
// previous reaction.

/**
 * Applies or removes the current user's reaction. Re-tapping the same emoji
 * removes it, matching mobile's toggle behaviour.
 *
 * `chat_reactions` has a composite primary key of (message_id, user_id), so
 * upserting a different emoji replaces the user's previous reaction in one
 * round trip.
 */
export async function toggleChatReaction(
  supabase: SupabaseClient,
  params: { messageId: string; userId: string; emoji: string; hadReaction: boolean }
): Promise<void> {
  if (params.hadReaction) {
    const { error } = await supabase
      .from("chat_reactions")
      .delete()
      .eq("message_id", params.messageId)
      .eq("user_id", params.userId);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("chat_reactions").upsert(
    {
      message_id: params.messageId,
      user_id: params.userId,
      emoji: params.emoji,
    },
    { onConflict: "message_id,user_id" }
  );
  if (error) throw error;
}

// ─── Reply previews ──────────────────────────────────────────────────────────

/** Groups reaction rows by message id, marking which belong to the current user. */
export function groupReactions(
  rows: { message_id: string; user_id: string; emoji: string }[],
  currentUserId: string
): Map<string, MessageReaction[]> {
  const byMessage = new Map<string, MessageReaction[]>();
  for (const row of rows) {
    const list = byMessage.get(row.message_id) ?? [];
    list.push({
      emoji: row.emoji,
      user_id: row.user_id,
      is_mine: row.user_id === currentUserId,
    });
    byMessage.set(row.message_id, list);
  }
  return byMessage;
}

/** Builds a display preview for a message being quoted in a reply. */
export function toReplyPreview(msg: ChatMessage, currentUserId: string): ReplyPreview {
  return {
    id: msg.id,
    message: msg.message,
    messageType: (msg.message_type ?? "text") as ReplyPreview["messageType"],
    senderId: msg.sender_id,
    isSent: msg.sender_id === currentUserId,
  };
}

/**
 * Resolves the quoted message for each row that has `reply_to`, and attaches
 * either the preview or a `replyDeleted` marker when the original is gone.
 */
export function attachReplyPreviews(
  rows: ChatMessage[],
  replyRows: Pick<ChatMessage, "id" | "message" | "message_type" | "sender_id">[],
  currentUserId: string
): ChatMessage[] {
  const replyById = new Map(replyRows.map((r) => [r.id, r]));

  return rows.map((m) => {
    if (!m.reply_to) return m;

    const original = replyById.get(m.reply_to);
    if (!original) {
      return { ...m, replyTo: null, replyDeleted: true };
    }

    const replyTo: ReplyPreview = {
      id: original.id,
      message: original.message,
      messageType: (original.message_type ?? "text") as ReplyPreview["messageType"],
      senderId: original.sender_id,
      isSent: original.sender_id === currentUserId,
    };
    return { ...m, replyTo, replyDeleted: false };
  });
}