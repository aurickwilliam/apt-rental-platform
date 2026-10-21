/**
 * Notification feed row composition.
 *
 * A feed row (web drawer and mobile list) is one control, so its accessible name has to spell out the
 * text the row shows — sender/title, action, preview and timestamp — plus
 * unread state. Compact expanded members keep the sender in their accessible
 * name even though their visible identity is supplied by the parent summary.
 *
 * Kept pure and free of package imports so it runs under `node:test`
 * (`pnpm --filter web test`) and the mobile Jest suite.
 */
export interface NotificationRowLabelParts {
  title: string;
  message?: string | null;
  preview?: string | null;
  isRead: boolean;
  timestamp?: string;
}

export function composeNotificationRowLabel({
  title,
  message,
  preview,
  isRead,
  timestamp,
}: NotificationRowLabelParts): string {
  const parts: string[] = [title];

  if (message) parts.push(message);
  if (preview) parts.push(preview);
  if (!isRead) parts.push("unread");
  if (timestamp) parts.push(timestamp);

  return parts.join(", ");
}

interface NotificationRowContent {
  type: string;
  message: string | null;
  data: unknown;
}

/**
 * Presentation only. Never extract names, amounts or actions from prose.
 * Historical/unknown payloads keep their original title and message; only
 * explicit chat metadata opts into the sender + action composition.
 */
export function getNotificationRowPresentation(
  notification: NotificationRowContent,
  reactionPreview: string | null,
): { action: string | null; preview: string | null } {
  const data = notification.data;
  const payload = data && typeof data === "object" && !Array.isArray(data)
    ? data as { event?: unknown; screen?: unknown }
    : {};
  const event = payload.event;
  if (notification.type !== "message") return { action: null, preview: notification.message };
  if (event === "reaction") {
    const message = notification.message?.trim();
    return {
      action: message ? message[0].toLowerCase() + message.slice(1) : null,
      preview: reactionPreview,
    };
  }
  if (event !== undefined || payload.screen !== "chat") {
    return { action: null, preview: notification.message };
  }
  // Keep media placeholders as previews too: the payload does not reliably
  // distinguish an attachment placeholder from identical user-authored text.
  return { action: "sent you a message", preview: notification.message };
}
