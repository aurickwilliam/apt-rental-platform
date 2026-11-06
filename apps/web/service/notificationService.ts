"use client";

import { createClient } from "@repo/supabase/browser";
import type { Database } from "@repo/supabase";
import type { ChatRecipientAudience } from "@/lib/notification-audience";
import { resolveChatAudiencesWith } from "@/lib/chat-notification-audience";
import { sortNotificationsNewestFirst } from "@repo/utils";

type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

export type FeedNotification = Pick<
  NotificationRow,
  "id" | "user_id" | "type" | "title" | "message" | "data" | "is_read" | "created_at"
> & { resolvedChatAudience?: ChatRecipientAudience };

const FEED_COLUMNS =
  "id, user_id, type, title, message, data, is_read, created_at";

const UNREAD_PAGE_SIZE = 500;
const WRITE_BATCH_SIZE = 100;

/** Keep bounded recent history plus every unread row, in keyset pages. This
 * makes portal counts/Unread/Mark all correct even when another portal fills
 * the latest-50 history window. One shared feed owns these reads. */
export async function fetchNotificationFeed(internalUserId: string): Promise<FeedNotification[]> {
  const supabase = createClient();
  const recentRequest = supabase.from("notifications").select(FEED_COLUMNS)
    .eq("user_id", internalUserId).order("created_at", { ascending: false })
    .order("id", { ascending: true }).limit(50);
  const unreadRequest = (async () => {
    const rows: FeedNotification[] = [];
    let cursor: { id: string; created_at: string } | null = null;
    while (true) {
      let query = supabase.from("notifications").select(FEED_COLUMNS)
        .eq("user_id", internalUserId).eq("is_read", false);
      if (cursor) query = query.or(`created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`);
      const { data, error } = await query.order("created_at", { ascending: false })
        .order("id", { ascending: false }).limit(UNREAD_PAGE_SIZE);
      if (error) throw error;
      const page = (data ?? []) as FeedNotification[];
      rows.push(...page);
      if (page.length < UNREAD_PAGE_SIZE) return rows;
      const last = page.at(-1)!;
      if (cursor?.id === last.id) throw new Error("Unread notification cursor did not advance.");
      cursor = { id: last.id, created_at: last.created_at };
    }
  })();
  const [recent, unread] = await Promise.all([recentRequest, unreadRequest]);
  if (recent.error) throw recent.error;
  const byId = new Map(unread.map(row => [row.id, row]));
  for (const row of (recent.data ?? []) as FeedNotification[]) {
    const current = byId.get(row.id);
    byId.set(row.id, current?.is_read || row.is_read ? { ...row, is_read: true } : row);
  }
  const resolved = await resolveChatAudiencesWith([...byId.values()], internalUserId, async ids => {
    const batches = [];
    for (let start = 0; start < ids.length; start += 100) {
      const { data, error } = await supabase.from("apartments").select("id, landlord_id").in("id", ids.slice(start, start + 100));
      if (error) throw error;
      batches.push(...(data ?? []));
    }
    return batches;
  }, () => console.error("[notifications] Couldn't resolve chat notification ownership."));
  return sortNotificationsNewestFirst(resolved);
}

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
  // One bounded ownership lookup inside the existing shared store load. Never
  // publish raw legacy chat while this resolves, and never query per consumer.
  // A failed lookup keeps other notifications and explicit audiences and
  // leaves legacy chat unresolved, without writes or PII in logs.
  return resolveChatAudiencesWith(
    (data ?? []) as FeedNotification[],
    internalUserId,
    async (apartmentIds) => {
      const { data: apartments, error: ownershipError } = await supabase
        .from("apartments")
        .select("id, landlord_id")
        .in("id", apartmentIds);
      if (ownershipError) throw ownershipError;
      return apartments ?? [];
    },
    () => console.error("[notifications] Couldn't resolve chat notification ownership."),
  );
}

/** Marks one row read. Never inserts — inserts are trigger/service-only. */
export async function markNotificationRead(id: string, internalUserId: string): Promise<void> {
  await markNotificationsRead([id], internalUserId);
}

/** Marks exactly the given ids read (caller scopes to the visible portal). */
export async function markNotificationsRead(ids: string[], internalUserId: string): Promise<void> {
  if (ids.length === 0) return;
  if (!internalUserId) throw new Error("A notification recipient is required.");
  const supabase = createClient();
  const unique = [...new Set(ids)];
  for (let start = 0; start < unique.length; start += WRITE_BATCH_SIZE) {
    const batch = unique.slice(start, start + WRITE_BATCH_SIZE);
    const { data, error } = await supabase.from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("user_id", internalUserId).in("id", batch).select("id");
    if (error) throw error;
    if (data?.length !== batch.length) throw new Error("Couldn't confirm all notification read updates.");
  }
}
