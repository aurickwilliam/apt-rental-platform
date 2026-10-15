/**
 * Canonical chat message types for the web app, shared by the tenant and
 * landlord conversation views. Mirrors the shapes in
 * `apps/mobile/service/chat/chatService.ts` so both platforms read and write
 * the same rows.
 */

export type MessageType = "text" | "image" | "video" | "gif";

/** One user's reaction on a message — at most one per (message, user). */
export interface MessageReaction {
  emoji: string;
  user_id: string;
  is_mine: boolean;
}

/** The quoted message a reply points at, resolved for display. */
export interface ReplyPreview {
  id: string;
  message: string | null;
  messageType: MessageType;
  senderId: string;
  isSent: boolean;
}

export interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string | null;
  message_type?: string | null;
  is_read: boolean;
  read_at: string | null;
  apartment_id: string | null;
  created_at: string;
  updated_at: string;
  /** Raw FK on the row; resolved into `replyTo` for display. */
  reply_to?: string | null;
  replyTo?: ReplyPreview | null;
  /** True when the quoted message was deleted and can't be previewed. */
  replyDeleted?: boolean;
  reactions: MessageReaction[];
  /** Optimistic rows get a `temp-` id and can neither react nor be replied to. */
  isPending?: boolean;

  // ─── Attachments ─────────────────────────────────────────────────────────
  // Mirrors the `chat` attachment columns. Only one of `attachment_path`
  // (private `chat-images` object) or `attachment_url` (external CDN, used by
  // GIFs) is set — exactly the split mobile's `chatService` writes.
  attachment_path?: string | null;
  /** External media URL (Giphy CDN). Rendered directly; never signed. */
  attachment_url?: string | null;
  attachment_mime_type?: string | null;
  attachment_thumbnail_path?: string | null;
  /** Batches a multi-file send into one visual group. */
  group_id?: string | null;
  /**
   * Resolved signed URL for `attachment_path`, produced at read time. Never
   * persisted. Optimistic rows carry the local object URL here instead so a
   * pending attachment previews before the upload lands.
   */
  resolvedUrl?: string | null;
}