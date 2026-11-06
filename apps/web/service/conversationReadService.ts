"use client";

import type { createClient } from "@repo/supabase/browser";
import { sortNotificationsNewestFirst } from "@repo/utils";
import { compareReadTimestamps, type ViewedConversationWindow } from "@/lib/notification-read-state";

type Client = ReturnType<typeof createClient>;
interface ThreadQuery<Q> {
  eq(column: string, value: string | boolean): Q;
  is(column: string, value: null): Q;
}

export interface ConversationReadTarget {
  viewerId: string;
  peerId: string;
  apartmentId: string | null;
}

/** Only rendered incoming IDs verified through caller RLS may be updated.
 * Future arrivals, backdated inserts and same-timestamp siblings are excluded. */
export async function readViewedConversation(
  supabase: Client, target: ConversationReadTarget, visibleIds: string[],
): Promise<ViewedConversationWindow | null> {
  if (!visibleIds.length || target.viewerId === target.peerId) return null;
  const thread = <Q extends ThreadQuery<Q>>(initial: Q): Q => {
    const query = initial.eq("receiver_id", target.viewerId).eq("sender_id", target.peerId);
    return target.apartmentId ? query.eq("apartment_id", target.apartmentId) : query.is("apartment_id", null);
  };
  const { data: visible, error: readError } = await thread(supabase.from("chat")
    .select("id, created_at, is_read").in("id", [...new Set(visibleIds)].slice(0, 100))).limit(100);
  if (readError) throw readError;
  if (!visible?.length) return null;
  const verified = sortNotificationsNewestFirst(visible);
  const through = verified[0].created_at;
  if (!Number.isFinite(Date.parse(through))) throw new Error("Invalid message read cutoff.");
  const verifiedIds = verified.map(row => row.id);
  const { data: changed, error: writeError } = await thread(supabase.from("chat")
    .update({ is_read: true, read_at: new Date().toISOString() }).select("id"))
    .eq("is_read", false).in("id", verifiedIds);
  if (writeError) throw writeError;
  const confirmed = new Set([...(changed ?? []).map(row => row.id), ...verified.filter(row => row.is_read).map(row => row.id)]);
  const unconfirmed = verified.filter(row => !confirmed.has(row.id)).map(row => row.id);
  if (unconfirmed.length) {
    // Another device may have won the same idempotent read. Confirm, don't
    // treat a zero-row UPDATE as success or mark another recipient's activity.
    const { data, error } = await thread(supabase.from("chat").select("id, is_read").in("id", unconfirmed));
    if (error || data?.some(row => !row.is_read) || data?.length !== unconfirmed.length) throw new Error("Couldn't confirm message read status.");
  }
  const times = [...new Set(verified.map(row => row.created_at))];
  const [{ data: ambiguous, error: ambiguityError }, unreadCount] = await Promise.all([
    thread(supabase.from("chat").select("created_at").eq("is_read", false)).in("created_at", times).limit(500),
    countConversationUnread(supabase, target),
  ]);
  if (ambiguityError) throw ambiguityError;
  const readTimestamps = (ambiguous?.length ?? 0) >= 500 ? [] : times.filter(time =>
    !ambiguous?.some(row => compareReadTimestamps(row.created_at, time) === 0),
  );
  return { ...target, through, readTimestamps, messageIds: verifiedIds, unreadCount };
}

export async function countConversationUnread(supabase: Client, target: ConversationReadTarget): Promise<number> {
  let query = supabase.from("chat").select("id", { count: "exact", head: true })
    .eq("receiver_id", target.viewerId).eq("sender_id", target.peerId).eq("is_read", false);
  query = target.apartmentId ? query.eq("apartment_id", target.apartmentId) : query.is("apartment_id", null);
  const { count, error } = await query;
  if (error || count === null) throw new Error("Couldn't refresh chat unread count.");
  return Math.max(0, count);
}
