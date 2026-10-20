"use client";

import { createClient } from "@repo/supabase/browser";
import type { Database } from "@repo/supabase";
import type { ChatRecipientAudience } from "@/lib/notification-audience";
import { getLegacyChatApartmentIds, resolveChatNotificationAudiences } from "@/lib/chat-notification-audience";

type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

export type FeedNotification = Pick<
  NotificationRow,
  "id" | "user_id" | "type" | "title" | "message" | "data" | "is_read" | "created_at"
> & { resolvedChatAudience?: ChatRecipientAudience };

const FEED_COLUMNS =
  "id, user_id, type, title, message, data, is_read, created_at";

/** Bounded feed, newest first. RLS already scopes rows to the caller. */
export async function fetchNotifications(
  internalUserId: string,
  limit = 50,
): Promise<FeedNotification[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select(FEED_COLUMNS)
    .eq("user_id", internalUserId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: true })
    .limit(limit);

  if (error) throw error;
  const notifications = (data ?? []) as FeedNotification[];
  const apartmentIds = getLegacyChatApartmentIds(notifications, internalUserId);
  if (apartmentIds.length === 0) {
    return resolveChatNotificationAudiences(notifications, internalUserId, []);
  }

  // One bounded ownership lookup inside the existing shared store load. Never
  // publish raw legacy chat while this resolves, and never query per consumer.
  try {
    const { data: apartments, error: ownershipError } = await supabase
      .from("apartments")
      .select("id, landlord_id")
      .in("id", apartmentIds);
    if (ownershipError) throw ownershipError;
    return resolveChatNotificationAudiences(notifications, internalUserId, apartments ?? []);
  } catch {
    // Preserve other notifications and explicit audiences if context is
    // unavailable. Legacy chat fails closed, without writes or PII in logs.
    console.error("[notifications] Couldn't resolve chat notification ownership.");
    return resolveChatNotificationAudiences(notifications, internalUserId, []);
  }
}

/** Marks one row read. Never inserts — inserts are trigger/service-only. */
export async function markNotificationRead(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}

/** Marks exactly the given ids read (caller scopes to the visible portal). */
export async function markNotificationsRead(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const supabase = createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .in("id", ids);

  if (error) throw error;
}
