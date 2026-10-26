import type { notifications as enNotifications } from "../en/notifications";

export const notifications: Record<keyof typeof enNotifications, string> = {
  "notifications.title": "Mga Notification",
  "notifications.markAllRead": "Markahan lahat bilang nabasa",
  "notifications.markRead": "Markahan bilang nabasa",
  "notifications.markUnread": "Markahan bilang hindi pa nabasa",
  "notifications.empty": "Wala pang notification.",
  "notifications.empty.description": "Dito lalabas ang mga update tungkol sa rentals mo.",
  "notifications.unreadCount": "{count} hindi pa nabasa",

  "notifications.action.sentMessage": "nagpadala sa iyo ng mensahe",
  "notifications.unreadLabel": "hindi pa nabasa",
  "notifications.group.sentOne": "Nagpadala sa iyo ng 1 mensahe",
  "notifications.group.sentOther": "Nagpadala sa iyo ng {count} mensahe",
  "notifications.group.latest": "Pinakabago: {preview}",

  // Drawer chrome and floating bell.
  "notifications.close": "Isara ang mga notification",
  "notifications.filter.unread": "Hindi pa nabasa",
  "notifications.markAllVisible": "Markahan lahat bilang nabasa",
  "notifications.opening": "Binubuksan ang mga notification…",
  "notifications.loading": "Naglo-load ng mga notification",
  "notifications.caughtUp": "Wala kang hindi pa nabasa.",
  "notifications.resetBellPosition": "I-reset ang posisyon ng bell",
  "notifications.expandFrom": "Palawakin ang mga mensahe mula kay {name}",
  "notifications.collapseFrom": "Isara ang mga mensahe mula kay {name}",
  "notifications.messagesFrom": "Mga mensahe mula kay {name}",
  "notifications.bell.title": "Mga Notification",
  "notifications.bell.titleHint":
    "Mga Notification. I-drag para ilipat. I-double-click para i-reset ang posisyon.",
  "notifications.bell.aria": "Mga Notification",
  "notifications.bell.ariaUnread": "Mga Notification, {count} hindi pa nabasa",
  "notifications.bell.dragHint": "I-drag para ilipat.",
};
