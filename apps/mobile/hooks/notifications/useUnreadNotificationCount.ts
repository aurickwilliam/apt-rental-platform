import { useNotifications } from "./useNotifications";

/** Unread rows the active portal shows (the bell badge); same feed as the list. */
export function useUnreadNotificationCount() {
  const { unreadCount } = useNotifications();

  return { unreadCount };
}
