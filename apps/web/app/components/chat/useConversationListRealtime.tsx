"use client";

import { useEffect, useMemo, useRef } from "react";
import { toast } from "@heroui/react";
import { createClient } from "@repo/supabase/browser";

import UserAvatar from "@/app/components/profile/UserAvatar";
import { conversationPreview } from "@/lib/chat-message-presentation";
import type { ConversationContact } from "@/lib/conversation-contacts";
import type { LatestMessage } from "@/lib/conversation-list";

/** The columns of a `chat` insert the list needs. */
interface ChatInsert {
  sender_id: string;
  receiver_id: string;
  apartment_id: string | null;
  message: string | null;
  message_type: string | null;
  created_at: string;
}

interface Options {
  currentUserId: string;
  /** The open conversation's key: messages for it never count as unread or toast. */
  activeKey: string | null;
  findContact: (conversationKey: string) => ConversationContact | undefined;
  /** Updates the row; `countAsUnread` is true for a message received in a chat that is not open. */
  applyLatestMessage: (conversationKey: string, latest: LatestMessage, countAsUnread: boolean) => void;
  /** Returns true (and reloads the lists) when the conversation isn't listed yet. */
  refreshIfNewConversation: (conversationKey: string) => boolean;
}

const keyFor = (otherUserId: string, apartmentId: string | null) => `${otherUserId}:${apartmentId ?? "none"}`;

/**
 * Keeps the Messages list live: every message you send or receive updates its
 * row (preview, time, unread count) and moves it up the list, and a message
 * from a chat you are not viewing raises a toast. Muted and blocked chats stay
 * quiet. One channel per signed-in user, shared by both portals.
 */
export default function useConversationListRealtime(options: Options) {
  const supabase = useMemo(() => createClient(), []);
  const latest = useRef(options);
  useEffect(() => {
    latest.current = options;
  });

  const { currentUserId } = options;
  useEffect(() => {
    const handle = (row: ChatInsert, fromMe: boolean) => {
      const current = latest.current;
      const key = keyFor(fromMe ? row.receiver_id : row.sender_id, row.apartment_id);
      // A chat that started while the page was open: reload the lists instead.
      if (current.refreshIfNewConversation(key)) return;

      const isOpen = key === current.activeKey;
      const update: LatestMessage = {
        message: row.message,
        messageType: row.message_type,
        createdAt: row.created_at,
        fromMe,
      };
      const countAsUnread = !fromMe && !isOpen;
      current.applyLatestMessage(key, update, countAsUnread);

      const contact = current.findContact(key);
      if (!countAsUnread || !contact || contact.isMuted || contact.blockedByMe) return;
      const initials = contact.name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("");
      toast(<span className="font-nunito font-bold text-primary">{contact.name || "New message"}</span>, {
        description: conversationPreview({ lastMessage: row.message, lastMessageType: row.message_type, lastSenderIsMe: false }) ?? "New message",
        // The sender's avatar stands in for the default info icon.
        indicator: <UserAvatar src={contact.avatar} initials={initials} alt={contact.name} size="sm" />,
        timeout: 6000,
      });
    };

    const channel = supabase
      .channel(`messages-list:${currentUserId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat", filter: `receiver_id=eq.${currentUserId}` },
        (payload: { new: ChatInsert }) => handle(payload.new, false)
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat", filter: `sender_id=eq.${currentUserId}` },
        (payload: { new: ChatInsert }) => handle(payload.new, true)
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [currentUserId, supabase]);
}
