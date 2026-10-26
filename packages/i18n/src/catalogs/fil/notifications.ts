import type { notifications as enNotifications } from "../en/notifications";

export const notifications: Record<keyof typeof enNotifications, string> = {
  "notifications.title": "Mga Notification",
  "notifications.markAllRead": "Markahan lahat bilang nabasa",
  "notifications.markRead": "Markahan bilang nabasa",
  "notifications.markUnread": "Markahan bilang hindi pa nabasa",
  "notifications.empty": "Wala pang notification.",
  "notifications.empty.description": "Dito lalabas ang mga update tungkol sa rentals mo.",
  "notifications.unreadCount": "{count} hindi pa nabasa",
};
