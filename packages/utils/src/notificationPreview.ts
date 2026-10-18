/**
 * Notification feed previews.
 *
 * Reaction notifications (the `notify_chat_reaction` trigger in
 * `supabase/migrations/20261017090635_chat_reaction_notifications.sql`) carry a
 * short, server-truncated `data.messagePreview`. Both feeds render it as a
 * secondary quoted line under the notification message; every other producer
 * omits the key, so absence is the normal case and never an error.
 */

/** Mirrors the database-side truncation in `notify_chat_reaction`. */
export const NOTIFICATION_PREVIEW_MAX_LENGTH = 120;

/**
 * Returns the row's `data.messagePreview` as a trimmed one-line string, or null
 * when the payload has none. Malformed or blank values degrade to null so an
 * unexpected payload can never break the feed.
 */
export function getNotificationPreview(data: unknown): string | null {
  if (data === null || typeof data !== 'object') return null;

  const preview = (data as { messagePreview?: unknown }).messagePreview;
  if (typeof preview !== 'string') return null;

  const trimmed = preview.trim();
  if (trimmed.length === 0) return null;

  return trimmed.slice(0, NOTIFICATION_PREVIEW_MAX_LENGTH);
}
