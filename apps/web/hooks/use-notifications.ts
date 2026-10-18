"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { createClient } from "@repo/supabase/browser";

import { useUser } from "@/hooks/use-user";
import { useAsyncResource } from "@/hooks/use-async-resource";
import {
  fetchNotifications,
  markNotificationRead,
  markNotificationsRead,
  type FeedNotification,
} from "@/service/notificationService";
import {
  getVisibleUnreadIds,
  isNotificationVisibleInPortal,
  type ActivePortal,
} from "@/lib/notification-audience";

type ChangeCallback = () => void;

interface ChannelEntry {
  refCount: number;
  callbacks: Set<ChangeCallback>;
  removeChannel: (() => void) | null;
}

// One realtime channel per internal user, shared by every hook instance
// (bell + drawer mount separately). Consumers attach/detach by refcount;
// the channel is removed when the last one leaves. Mirrors mobile's
// useNotificationRealtime registry.
const registry = new Map<string, ChannelEntry>();

function attach(userId: string, onChange: ChangeCallback): () => void {
  const existing = registry.get(userId);
  if (existing) {
    existing.refCount += 1;
    existing.callbacks.add(onChange);
    return () => detach(userId, onChange);
  }

  const entry: ChannelEntry = { refCount: 1, callbacks: new Set([onChange]), removeChannel: null };
  const supabase = createClient();
  const channel = supabase
    .channel(`notifications-live:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      () => {
        for (const callback of entry.callbacks) callback();
      },
    )
    .subscribe();

  entry.removeChannel = () => {
    void supabase.removeChannel(channel);
  };
  registry.set(userId, entry);
  return () => detach(userId, onChange);
}

function detach(userId: string, onChange: ChangeCallback) {
  const entry = registry.get(userId);
  if (!entry) return;
  entry.callbacks.delete(onChange);
  entry.refCount -= 1;
  if (entry.refCount <= 0) {
    registry.delete(userId);
    entry.removeChannel?.();
  }
}

/**
 * Account feed scoped to the active portal for display. Rows stay keyed by
 * the account (never the portal): switching portals only changes which
 * subset is shown — nothing is deleted or marked read by the switch.
 */
export function useNotifications(portal: ActivePortal) {
  const { profile, loading: profileLoading } = useUser();
  const userId = profile?.id ?? null;

  const loader = useCallback(() => {
    if (!userId) return Promise.resolve([] as FeedNotification[]);
    return fetchNotifications(userId);
  }, [userId]);

  const resource = useAsyncResource<FeedNotification[]>(
    loader,
    [],
    "Couldn't load your notifications.",
  );

  // Realtime is the single refetch trigger; callbacks flow through refs so
  // re-renders never resubscribe the shared channel.
  const refreshRef = useRef(resource.refresh);
  useEffect(() => {
    refreshRef.current = resource.refresh;
  });
  useEffect(() => {
    if (!userId) return;
    return attach(userId, () => {
      void refreshRef.current();
    });
  }, [userId]);

  const visible = useMemo(
    () => resource.data.filter((n) => isNotificationVisibleInPortal(n, portal)),
    [resource.data, portal],
  );
  const unreadIds = useMemo(
    () => getVisibleUnreadIds(resource.data, portal),
    [resource.data, portal],
  );

  const markOneRead = useCallback(
    async (id: string) => {
      resource.setData((current) =>
        current.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
      try {
        await markNotificationRead(id);
      } catch {
        // Realtime UPDATE (or the next refresh) converges the row; the
        // optimistic flag keeps the badge correct meanwhile.
        resource.refresh();
      }
    },
    [resource],
  );

  const markVisibleRead = useCallback(async () => {
    const ids = getVisibleUnreadIds(resource.data, portal);
    if (ids.length === 0) return;
    resource.setData((current) =>
      current.map((n) => (ids.includes(n.id) ? { ...n, is_read: true } : n)),
    );
    try {
      await markNotificationsRead(ids);
    } catch {
      resource.refresh();
    }
  }, [resource, portal]);

  return {
    notifications: visible,
    unreadCount: unreadIds.length,
    loading: profileLoading || resource.loading,
    error: resource.error,
    refresh: resource.refresh,
    markOneRead,
    markVisibleRead,
  };
}
