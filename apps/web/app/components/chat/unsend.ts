import type { SupabaseClient } from "@supabase/supabase-js";

import { CHAT_IMAGES_BUCKET } from "./attachments";
import { isOptimisticMessage } from "./conversationEvents";
import type { ChatMessage } from "./types";

/**
 * Mobile's `buildConversationKey` (`apps/mobile/service/chat/chatService.ts`).
 * Mobile chat screens hear unsends as a `message_deleted` broadcast on
 * `chat:msg:{key}`, so web has to address the same topic.
 */
export function mobileConversationKey(userAId: string, userBId: string, apartmentId: string | null): string {
  const [first, second] = [userAId, userBId].sort();
  return `chat:${apartmentId ?? "none"}:${first}:${second}`;
}

/** Only your own, already-saved messages can be unsent (mobile's `canUnsend`). */
export function canUnsendMessage(message: ChatMessage, currentUserId: string): boolean {
  return message.sender_id === currentUserId && !isOptimisticMessage(message);
}

/**
 * Removes a message for everyone, in mobile's order: its private
 * `chat-images` files first (best effort), then the row, scoped to the sender.
 * Throws when the row couldn't be deleted.
 */
export async function deleteChatMessage(
  supabase: SupabaseClient,
  params: { message: ChatMessage; senderId: string }
): Promise<void> {
  const paths = [params.message.attachment_path, params.message.attachment_thumbnail_path].filter(
    (path): path is string => Boolean(path)
  );
  if (paths.length > 0) {
    const { error: storageError } = await supabase.storage.from(CHAT_IMAGES_BUCKET).remove(paths);
    if (storageError) console.warn("Chat attachment delete failed (non-blocking):", storageError.message);
  }

  const { data, error } = await supabase
    .from("chat")
    .delete()
    .eq("id", params.message.id)
    .eq("sender_id", params.senderId)
    .select("id");
  if (error) throw error;
  if (!data || data.length === 0) throw new Error("Message could not be unsent.");
}

/** Tells the other person's open mobile chat to drop the message right away. */
export async function broadcastMessageDeleted(
  supabase: SupabaseClient,
  params: { messageId: string; senderId: string; receiverId: string; apartmentId: string | null }
): Promise<void> {
  const channel = supabase.channel(
    `chat:msg:${mobileConversationKey(params.senderId, params.receiverId, params.apartmentId)}`
  );
  try {
    const result = await channel.httpSend("message_deleted", { id: params.messageId, apartment_id: params.apartmentId });
    if (!result.success) console.warn("Unsend broadcast failed (non-blocking):", result.error);
  } finally {
    await supabase.removeChannel(channel);
  }
}
