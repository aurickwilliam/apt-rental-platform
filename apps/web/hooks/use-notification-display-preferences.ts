"use client";

import { useCallback, useSyncExternalStore } from "react";

import {
  DEFAULT_NOTIFICATION_DISPLAY,
  NOTIFICATION_DISPLAY_CHANGE_EVENT,
  parseNotificationDisplay,
  readNotificationDisplayRaw,
  saveNotificationDisplay,
  type NotificationDisplayPreferences,
} from "@/lib/notification-display-preferences";

function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(NOTIFICATION_DISPLAY_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(NOTIFICATION_DISPLAY_CHANGE_EVENT, onChange);
  };
}

// useSyncExternalStore needs a referentially stable snapshot, so the parsed
// object is reused until the stored string changes.
let cachedRaw: string | null = null;
let cachedValue: NotificationDisplayPreferences = DEFAULT_NOTIFICATION_DISPLAY;

function getSnapshot(): NotificationDisplayPreferences {
  const raw = readNotificationDisplayRaw(window.localStorage);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedValue = parseNotificationDisplay(raw);
  }
  return cachedValue;
}

/**
 * Shared notification display preferences (entry point + drawer side). Every
 * consumer (bell, sidebar tab, drawer, Settings) reads the same store, and a
 * change applies immediately in this tab and, through `storage`, in others.
 */
export function useNotificationDisplayPreferences() {
  const preferences = useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_NOTIFICATION_DISPLAY);

  const update = useCallback((patch: Partial<NotificationDisplayPreferences>) => {
    saveNotificationDisplay({ ...getSnapshot(), ...patch }, window.localStorage);
    window.dispatchEvent(new Event(NOTIFICATION_DISPLAY_CHANGE_EVENT));
  }, []);

  return { preferences, update };
}
