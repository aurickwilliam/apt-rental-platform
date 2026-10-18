"use client";

import { createClient } from "@repo/supabase/browser";
import type { Database } from "@repo/supabase";

type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

export type FeedNotification = Pick<
  NotificationRow,
  "id" | "user_id" | "type" | "title" | "message" | "data" | "is_read" | "created_at"
>;

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
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as FeedNotification[];
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
