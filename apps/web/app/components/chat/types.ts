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
}