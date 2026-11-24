"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { createClient } from "@repo/supabase/browser";

import { useUser } from "@/hooks/use-user";
import { fetchNotifications, markNotificationRead, markNotificationsRead } from "@/service/notificationService";
import {
  getVisibleUnreadIds,
  isNotificationVisibleInPortal,
  type ActivePortal,
} from "@/lib/notification-audience";
import { EMPTY_NOTIFICATION_FEED, NotificationFeedStore } from "@/lib/notification-feed-store";

// Account identity, never portal or render callbacks. No session/global context.
const feeds = new Map<string, NotificationFeedStore>();

function getFeed(key: string, userId: string): NotificationFeedStore {
  const existing = feeds.get(key);
  if (existing) return existing;
  const store = new NotificationFeedStore({
    load: () => fetchNotifications(userId),
    connect: (onChange) => {
      const supabase = createClient();
      let joined = false;
      const channel = supabase
        .channel(`notifications-live:${userId}`)
        .on("postgres_changes", {
          event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}`,
        }, onChange)
        .subscribe((status) => {
          // A re-join may have missed events while the socket was down.
          if (status === "SUBSCRIBED" && joined) onChange();
          if (status === "SUBSCRIBED") joined = true;
        });
      // A hidden tab can miss events too: reconcile once when it is shown again.
      const onVisible = () => { if (document.visibilityState === "visible") onChange(); };
      const canListen = typeof document !== "undefined";
      if (canListen) document.addEventListener("visibilitychange", onVisible);
      return () => {
        if (canListen) document.removeEventListener("visibilitychange", onVisible);
        void supabase.removeChannel(channel);
      };
    },
    onIdle: () => { if (feeds.get(key) === store) feeds.delete(key); },
    onError: (message, error) => console.error(message, error),
  });
  feeds.set(key, store);
  return store;
}

const serverSnapshot = () => EMPTY_NOTIFICATION_FEED;
const noSubscription = () => () => {};

/** Shared latest-50 account feed; portal filtering never changes or acknowledges rows. */
export function useNotifications(portal: ActivePortal | null) {
  const { user, profile, loading: profileLoading } = useUser();
  const userId = profile?.id ?? null;
  const authUserId = user?.id ?? null;
  const store = portal && authUserId && userId ? getFeed(`${authUserId}:${userId}`, userId) : null;
  const snapshot = useSyncExternalStore(
    store?.subscribe ?? noSubscription,
    store?.getSnapshot ?? serverSnapshot,
    serverSnapshot,
  );

  const visible = useMemo(
    () => portal ? snapshot.notifications.filter(n => isNotificationVisibleInPortal(n, portal)) : [],
    [snapshot.notifications, portal],
  );
  const unreadIds = useMemo(
    () => portal ? getVisibleUnreadIds(snapshot.notifications, portal) : [],
    [snapshot.notifications, portal],
  );
  const markOneRead = useCallback(async (id: string) => {
    await store?.markRead([id], () => markNotificationRead(id));
  }, [store]);
  const markManyRead = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    await store?.markRead(ids, () => markNotificationsRead(ids));
  }, [store]);
  const markVisibleRead = useCallback(async () => {
    if (!store || !portal) return;
    const ids = getVisibleUnreadIds(store.getSnapshot().notifications, portal);
    await store.markRead(ids, () => markNotificationsRead(ids));
  }, [store, portal]);
  /** Feed rows right now (not render-bound), for callers that match rows by payload identity. */
  const getFeedRows = useCallback(() => store?.getSnapshot().notifications ?? [], [store]);
  /**
   * Optimistic read of exactly these rows around a caller-supplied write.
   * Resolves true only when the write was confirmed (failures roll back).
   */
  const markIdsRead = useCallback(
    async (ids: string[], write: () => Promise<void>): Promise<boolean> => (store ? store.markRead(ids, write) : false),
    [store],
  );
  const refresh = useCallback(async () => { await store?.refresh(); }, [store]);

  return {
    notifications: visible,
    unreadCount: unreadIds.length,
    loading: !!portal && (profileLoading || snapshot.loading),
    error: snapshot.error,
    refresh,
    markOneRead,
    markManyRead,
    markVisibleRead,
    getFeedRows,
    markIdsRead,
  };
}
