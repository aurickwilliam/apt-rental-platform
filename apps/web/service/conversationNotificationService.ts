"use client";

import { createClient } from "@repo/supabase/browser";
import {
  markConversationNotificationsReadWith,
  type ConversationIdentity,
  type NotificationUpdateSource,
} from "@/lib/conversation-notification-sync";

/**
 * Marks the caller's unread message notifications of one conversation read, up
 * to a cutoff (see `lib/conversation-notification-sync.ts`). Update-only; RLS
 * limits it to the caller's own rows.
 */
export async function markConversationNotificationsRead(
  internalUserId: string,
  identity: ConversationIdentity,
  upTo: string,
): Promise<string[]> {
  return markConversationNotificationsReadWith(
    createClient() as unknown as NotificationUpdateSource,
    { userId: internalUserId, identity, upTo },
  );
}
