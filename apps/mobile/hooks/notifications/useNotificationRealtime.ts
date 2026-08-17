import { useEffect, useRef } from "react";

import { supabase } from "@repo/supabase";

import type { NotificationRow } from "@/service/notificationService";

export interface NotificationRealtimeCallbacks {
  /** Called on every event (INSERT/UPDATE/DELETE) — feed + count invalidation. */
  onChange?: () => void;
  /** Called only for INSERT events — in-app toast delivery. */
  onInsert?: (row: NotificationRow) => void;
}

interface ChannelEntry {
  refCount: number;
  subscribers: Set<NotificationRealtimeCallbacks>;
  channel: ReturnType<typeof supabase.channel> | null;
}

// One realtime subscription per user, shared by every notification consumer.
// Consumers attach/detach by refcount; the channel is torn down when the last
// one leaves. Callbacks are invoked through refs, so a consumer re-rendering
// never tears down and re-subscribes the channel.
const registry = new Map<string, ChannelEntry>();

function handleEvent(userId: string, payload: { eventType: string; new: unknown }) {
  const entry = registry.get(userId);
  if (!entry) return;

  for (const subscriber of entry.subscribers) {
    subscriber.onChange?.();

    if (payload.eventType === "INSERT" && subscriber.onInsert) {
      subscriber.onInsert(payload.new as NotificationRow);
    }
  }
}

function attach(userId: string, callbacks: NotificationRealtimeCallbacks): () => void {
  const existing = registry.get(userId);
  if (existing) {
    existing.refCount += 1;
    existing.subscribers.add(callbacks);
    return () => detach(userId, callbacks);
  }

  const entry: ChannelEntry = { refCount: 1, subscribers: new Set([callbacks]), channel: null };

  entry.channel = supabase
    .channel(`notifications-live:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => handleEvent(userId, payload),
    )
    .subscribe();

  registry.set(userId, entry);

  return () => detach(userId, callbacks);
}

function detach(userId: string, callbacks: NotificationRealtimeCallbacks) {
  const entry = registry.get(userId);
  if (!entry) return;

  entry.subscribers.delete(callbacks);
  entry.refCount -= 1;

  if (entry.refCount <= 0) {
    registry.delete(userId);
    if (entry.channel) {
      void supabase.removeChannel(entry.channel);
    }
  }
}

/**
 * Subscribes the caller to realtime changes on the user's notifications table.
 * All consumers share a single channel per user; callbacks are read through
 * refs, so callers can pass fresh closures every render without re-subscribing.
 */
export function useNotificationRealtime(
  userId: string | null,
  callbacks: NotificationRealtimeCallbacks,
) {
  const callbacksRef = useRef(callbacks);
  useEffect(() => {
    callbacksRef.current = callbacks;
  });

  useEffect(() => {
    if (!userId) return;

    const subscriber: NotificationRealtimeCallbacks = {
      onChange: () => callbacksRef.current.onChange?.(),
      onInsert: (row) => callbacksRef.current.onInsert?.(row),
    };

    return attach(userId, subscriber);
  }, [userId]);
}
