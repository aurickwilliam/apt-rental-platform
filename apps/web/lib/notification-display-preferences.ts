/**
 * Where notifications are opened from and which edge their drawer slides in
 * from. A per-browser display preference (like the sidebar collapse state), so
 * it lives in versioned localStorage rather than the account's delivery
 * preferences. Pure and storage-injected so it runs under `node:test`.
 */

export type NotificationEntry = "bell" | "sidebar";
export type NotificationDrawerSide = "left" | "right";

export interface NotificationDisplayPreferences {
  /** Floating draggable bell, or a Notifications tab in the sidebar. */
  entry: NotificationEntry;
  /** Edge the notifications drawer opens from. */
  drawerSide: NotificationDrawerSide;
}

export const NOTIFICATION_DISPLAY_STORAGE_KEY = "apt-notifications-display:v1";
export const NOTIFICATION_DISPLAY_CHANGE_EVENT = "apt-notifications-display:change";

export const DEFAULT_NOTIFICATION_DISPLAY: NotificationDisplayPreferences = {
  entry: "bell",
  drawerSide: "right",
};

type StorageLike = Pick<Storage, "getItem" | "setItem"> | null | undefined;

/** Parses a stored value; anything unreadable or unknown falls back to the default. */
export function parseNotificationDisplay(raw: string | null | undefined): NotificationDisplayPreferences {
  if (!raw) return DEFAULT_NOTIFICATION_DISPLAY;
  try {
    const parsed = JSON.parse(raw) as Partial<NotificationDisplayPreferences> | null;
    if (!parsed || typeof parsed !== "object") return DEFAULT_NOTIFICATION_DISPLAY;
    return {
      entry: parsed.entry === "sidebar" ? "sidebar" : DEFAULT_NOTIFICATION_DISPLAY.entry,
      drawerSide: parsed.drawerSide === "left" ? "left" : DEFAULT_NOTIFICATION_DISPLAY.drawerSide,
    };
  } catch {
    return DEFAULT_NOTIFICATION_DISPLAY;
  }
}

export function readNotificationDisplayRaw(storage?: StorageLike): string | null {
  try {
    return storage?.getItem(NOTIFICATION_DISPLAY_STORAGE_KEY) ?? null;
  } catch {
    return null;
  }
}

/** Persists the preferences; returns false when storage is unavailable. */
export function saveNotificationDisplay(
  preferences: NotificationDisplayPreferences,
  storage?: StorageLike,
): boolean {
  try {
    storage?.setItem(
      NOTIFICATION_DISPLAY_STORAGE_KEY,
      JSON.stringify({ entry: preferences.entry, drawerSide: preferences.drawerSide }),
    );
    return Boolean(storage);
  } catch {
    return false;
  }
}
