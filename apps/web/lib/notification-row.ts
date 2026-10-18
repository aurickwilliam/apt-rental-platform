/**
 * Notification feed row composition.
 *
 * A web feed row is one button, so its accessible name has to spell out the
 * text the row shows — title, message and, for reaction notifications, the
 * quoted message preview — plus the unread state, which `aria-label` would
 * otherwise hide from assistive technology.
 *
 * Kept pure and free of package imports so it runs under `node:test`
 * (`pnpm --filter web test`).
 */
export interface NotificationRowLabelParts {
  title: string;
  message?: string | null;
  preview?: string | null;
  isRead: boolean;
}

export function composeNotificationRowLabel({
  title,
  message,
  preview,
  isRead,
}: NotificationRowLabelParts): string {
  const parts: string[] = [title];

  if (message) parts.push(message);
  if (preview) parts.push(preview);
  if (!isRead) parts.push("unread");

  return parts.join(", ");
}
