import type {
  ChatMessage as Message,
  MessageReaction,
  ReplyPreview,
} from "@/app/components/chat/types";

export type TabKey = "current" | "inquiries";

export interface Contact {
  id: string;
  conversationKey: string;
  name: string;
  avatar: string;
  apartment: string;
  apartmentId: string | null;
  unreadCount: number;
  lastMessage?: string | null;
  lastMessageTime?: string | null;
  lastMessageType?: string | null;
  lastSenderIsMe?: boolean;
}

export type { MessageReaction, ReplyPreview };
export type { Message };
