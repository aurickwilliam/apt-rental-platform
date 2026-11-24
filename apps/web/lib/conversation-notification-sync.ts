/**
 * Keeps a chat conversation's notifications in step with its messages.
 *
 * Message read state (`chat.is_read`) and notification read state
 * (`notifications.is_read`) are separate rows. Viewing a conversation used to
 * update only the first, so the bell and the Notifications panel kept showing
 * unread dots for messages the person had already read.
 *
 * A message notification is matched to its conversation only by structured
 * payload fields written by `notify_chat_message()`: `type = 'message'`,
 * `data.senderId` (the peer) and `data.apartmentId` (null for a general
 * inquiry). Never by title, preview text or sender name. Rows with no
 * `senderId` (older rows) are never guessed: they stay manual-read.
 *
 * `notifications.created_at` and `chat.created_at` are both `now()` of the same
 * trigger transaction, so the newest read incoming message's timestamp is an
 * exact cutoff: notifications for messages that arrive afterwards stay unread.
 */

export interface ConversationIdentity {
  /** `public.users.id` of the other participant. */
  contactId: string;
  /** Listing the thread is about, or null for a general inquiry. */
  apartmentId: string | null;
}

export interface ConversationNotificationLike {
  id: string;
  type: string;
  is_read: boolean;
  created_at: string;
  data: unknown;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

/** Treats a missing listing and the literal 'none' key part the same way. */
export function normalizeApartmentId(value: unknown): string | null {
  const id = text(value);
  return id && id !== "none" ? id : null;
}

/** True when the notification is a chat-message row of exactly this thread. */
export function matchesConversation(
  notification: Pick<ConversationNotificationLike, "type" | "data">,
  identity: ConversationIdentity,
): boolean {
  if (notification.type !== "message") return false;
  const data = notification.data;
  if (!data || typeof data !== "object") return false;
  const payload = data as Record<string, unknown>;
  const senderId = text(payload.senderId);
  if (!senderId || senderId !== identity.contactId) return false;
  return normalizeApartmentId(payload.apartmentId) === identity.apartmentId;
}

/** Unread rows of this thread created at or before the cutoff (ISO strings). */
export function unreadIdsForConversation(
  notifications: readonly ConversationNotificationLike[],
  identity: ConversationIdentity,
  upTo: string,
): string[] {
  const cutoff = Date.parse(upTo);
  if (Number.isNaN(cutoff)) return [];
  return notifications
    .filter(
      (row) =>
        !row.is_read &&
        matchesConversation(row, identity) &&
        Date.parse(row.created_at) <= cutoff,
    )
    .map((row) => row.id);
}

/** The slice of a Supabase update builder this module uses (kept structural for tests). */
export interface NotificationUpdateQuery {
  eq(column: string, value: string | boolean): NotificationUpdateQuery;
  is(column: string, value: null): NotificationUpdateQuery;
  lte(column: string, value: string): NotificationUpdateQuery;
  select(columns: string): PromiseLike<{ data: { id: string }[] | null; error: unknown }>;
}

export interface NotificationUpdateSource {
  from(table: "notifications"): {
    update(values: { is_read: true; read_at: string }): NotificationUpdateQuery;
  };
}

/**
 * Marks the viewer's unread message notifications of one thread read, up to
 * the cutoff. The predicate is the same identity as `matchesConversation`,
 * evaluated in the database so it also covers rows past the loaded feed.
 * RLS still limits it to the caller's own rows; `user_id` is repeated for the
 * query planner and as a second guard. Idempotent. Returns the rows changed.
 */
export async function markConversationNotificationsReadWith(
  source: NotificationUpdateSource,
  args: { userId: string; identity: ConversationIdentity; upTo: string; now?: () => Date },
): Promise<string[]> {
  const { userId, identity, upTo, now = () => new Date() } = args;
  let query = source
    .from("notifications")
    .update({ is_read: true, read_at: now().toISOString() })
    .eq("user_id", userId)
    .eq("type", "message")
    .eq("is_read", false)
    .eq("data->>senderId", identity.contactId);
  query = identity.apartmentId
    ? query.eq("data->>apartmentId", identity.apartmentId)
    : query.is("data->>apartmentId", null);
  const { data, error } = await query.lte("created_at", upTo).select("id");
  if (error) throw error;
  return (data ?? []).map((row) => row.id);
}

export interface RetryOptions {
  /** Waits before attempts 2, 3, ... The task runs `delays.length + 1` times at most. */
  delays: readonly number[];
  sleep?: (ms: number) => Promise<void>;
  /** Stops retrying (unmount, account or conversation changed). */
  isCancelled?: () => boolean;
}

/** Bounded retry. Resolves true on success, false once attempts run out or it is cancelled. */
export async function retryBounded(
  task: () => Promise<void>,
  { delays, sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)), isCancelled = () => false }: RetryOptions,
): Promise<boolean> {
  for (let attempt = 0; attempt <= delays.length; attempt += 1) {
    if (isCancelled()) return false;
    try {
      await task();
      return true;
    } catch {
      if (attempt === delays.length) return false;
      await sleep(delays[attempt]);
    }
  }
  return false;
}

/** Retry waits for a failed notification sync after the messages were marked read. */
export const NOTIFICATION_SYNC_RETRY_DELAYS_MS = [2_000, 6_000] as const;

/** Incoming messages count as viewed only while the document is visible. */
export function isViewingConversation(visibilityState: string | undefined): boolean {
  return visibilityState !== "hidden";
}
