/** Notification drawer chrome. Row sentences are composed in `notificationRow`. */
export const notifications = {
  "notifications.title": "Notifications",
  "notifications.markAllRead": "Mark all as read",
  "notifications.markRead": "Mark as read",
  "notifications.markUnread": "Mark as unread",
  "notifications.empty": "No notifications yet.",
  "notifications.empty.description": "Updates about your rentals will show up here.",
  "notifications.unreadCount": "{count} unread",

  // Row and group composition (accessible names and summary lines).
  "notifications.action.sentMessage": "sent you a message",
  "notifications.unreadLabel": "unread",
  "notifications.group.sentOne": "Sent you 1 message",
  "notifications.group.sentOther": "Sent you {count} messages",
  "notifications.group.latest": "Latest: {preview}",

  // Drawer chrome and floating bell.
  "notifications.close": "Close notifications",
  "notifications.filter.unread": "Unread",
  "notifications.markAllVisible": "Mark all read",
  "notifications.opening": "Opening notifications…",
  "notifications.loading": "Loading notifications",
  "notifications.caughtUp": "You're all caught up.",
  "notifications.resetBellPosition": "Reset bell position",
  "notifications.expandFrom": "Expand messages from {name}",
  "notifications.collapseFrom": "Collapse messages from {name}",
  "notifications.messagesFrom": "Messages from {name}",
  "notifications.bell.title": "Notifications",
  "notifications.bell.titleHint":
    "Notifications. Drag to move. Double-click to reset position.",
  "notifications.bell.aria": "Notifications",
  "notifications.bell.ariaUnread": "Notifications, {count} unread",
  "notifications.bell.dragHint": "Drag to move.",
} as const;
