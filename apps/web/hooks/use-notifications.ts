"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { createClient } from "@repo/supabase/browser";

import { useUser } from "@/hooks/use-user";
import { fetchNotificationFeed, markNotificationRead, markNotificationsRead } from "@/service/notificationService";
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
  let announce = () => {};
  const store = new NotificationFeedStore({
    load: () => fetchNotificationFeed(userId),
    connect: (onChange) => {
      const supabase = createClient();
      let joined = false;
      const channel = supabase
        .channel(`notifications-live:${userId}`)
        .on("postgres_changes", {
          event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}`,
        }, onChange)
        .subscribe(status => {
          if (status === "SUBSCRIBED") {
            if (joined) onChange();
            joined = true;
          }
        });
      const visible = () => { if (typeof document === "undefined" || document.visibilityState === "visible") onChange(); };
      const broadcast = typeof window !== "undefined" && typeof BroadcastChannel !== "undefined"
        ? new BroadcastChannel(`apt-notifications:${key}`) : null;
      if (broadcast) broadcast.onmessage = () => onChange();
      const storageKey = `apt-notifications-read:${key}`;
      const storage = (event: StorageEvent) => { if (event.key === storageKey) onChange(); };
      announce = () => {
        if (broadcast) broadcast.postMessage("read");
        else if (typeof window !== "undefined") {
          try { window.localStorage.setItem(storageKey, `${Date.now()}:${Math.random()}`); } catch { /* Refocus/Realtime still reconcile when storage is unavailable. */ }
        }
      };
      if (typeof window !== "undefined") {
        window.addEventListener("focus", visible);
        window.addEventListener("online", visible);
        window.addEventListener("storage", storage);
        document.addEventListener("visibilitychange", visible);
      }
      return () => {
        announce = () => {};
        broadcast?.close();
        if (typeof window !== "undefined") {
          window.removeEventListener("focus", visible);
          window.removeEventListener("online", visible);
          window.removeEventListener("storage", storage);
          document.removeEventListener("visibilitychange", visible);
        }
        void supabase.removeChannel(channel);
      };
    },
    onIdle: () => { if (feeds.get(key) === store) feeds.delete(key); },
    onError: message => console.error(message),
    onWrite: () => announce(),
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
    const row = store?.getSnapshot().notifications.find(row => row.id === id && row.user_id === userId && portal && isNotificationVisibleInPortal(row, portal));
    if (!row || !store || !userId) return false;
    if (row.is_read) return true;
    return store.markRead([id], () => markNotificationRead(id, userId));
  }, [portal, store, userId]);
  const markManyRead = useCallback(async (ids: string[]) => {
    if (!store || !userId || !portal) return false;
    const allowed = new Set(getVisibleUnreadIds(store.getSnapshot().notifications, portal));
    const eligible = [...new Set(ids)].filter(id => allowed.has(id));
    if (!eligible.length) return true;
    return store.markRead(eligible, () => markNotificationsRead(eligible, userId));
  }, [portal, store, userId]);
  const markVisibleRead = useCallback(async () => {
    if (!store || !portal || !userId) return false;
    const ids = getVisibleUnreadIds(store.getSnapshot().notifications, portal);
    if (!ids.length) return true;
    return store.markRead(ids, () => markNotificationsRead(ids, userId));
  }, [store, portal, userId]);
  const refresh = useCallback(async () => { await store?.refresh(); }, [store]);

  return {
    ownerKey: authUserId && userId ? `${authUserId}:${userId}` : null,
    viewerId: userId,
    notifications: visible,
    unreadCount: unreadIds.length,
    loading: !!portal && (profileLoading || snapshot.loading),
    error: snapshot.error,
    refresh,
    markOneRead,
    markManyRead,
    markVisibleRead,
  };
}
