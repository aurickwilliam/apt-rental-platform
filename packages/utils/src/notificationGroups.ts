/**
 * Grouped notification feed units (shared by web and mobile).
 *
 * One `notifications` row is written per incoming chat message, so a burst
 * from one sender floods the drawer. This module collapses consecutive
 * ordinary chat-message rows into a single "message group" unit for
 * presentation only: the underlying records, their read state, the unread
 * badge and every acknowledgment path stay untouched.
 *
 * Groupable rows carry `type = 'message'`, `data.screen = 'chat'`, no
 * `data.event` (reaction notifications — and any future chat event — always
 * stay individual) and a usable `conversationKey` + `senderId` identity.
 * A missing or ambiguous identity stays an individual row rather than
 * risking a merge across conversations or senders.
 *
 * Window: a rolling session window over the newest-first feed. Walking the
 * sorted rows, a row joins the open group for its identity when the gap to
 * the previous (next newer) same-identity row is at most 15 minutes; a larger
 * gap starts a new group. Consecutive activity therefore keeps one group
 * growing (10:00, 10:14, 10:28 is one group), while a quiet gap splits it.
 * Timestamps compare at the same sub-millisecond precision as the shared
 * `sortNotificationsNewestFirst`, so the rule is deterministic for ties.
 *
 * A group's identity is its oldest loaded member: Realtime arrivals append at
 * the newest end and never change it, so expansion state survives them. It
 * changes only when that member ages out of the loaded (latest-50) window.
 * Counts describe the loaded feed and are never presented as exhaustive.
 */

import { sortNotificationsNewestFirst } from "./notificationOrder";

/** Gap between consecutive messages that keeps one rolling group open. */
export const MESSAGE_GROUP_WINDOW_MS = 15 * 60 * 1000;

/** Structural row shape shared by the web feed row and the ordering helper. */
export interface GroupableNotification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  data: unknown;
  is_read: boolean;
  created_at: string;
}

/** Conversation identity of one ordinary chat-message notification. */
export interface ChatMessageIdentity {
  conversationKey: string;
  senderId: string;
}

/** One row that is not part of a group; keeps its original position and id. */
export interface NotificationFeedSingle<T extends GroupableNotification> {
  kind: "single";
  notification: T;
  id: string;
  created_at: string;
}

/** One collapsed burst of ordinary chat messages from one sender. */
export interface MessageGroupUnit<T extends GroupableNotification> {
  kind: "message-group";
  /** Stable identity: conversation + sender + oldest loaded member. */
  key: string;
  conversationKey: string;
  senderId: string;
  /** Members, newest first. */
  members: T[];
  /** Newest member: the summary's preview and timestamp. */
  latest: T;
  count: number;
  hasUnread: boolean;
  id: string;
  created_at: string;
}

export type NotificationFeedUnit<T extends GroupableNotification> =
  | NotificationFeedSingle<T>
  | MessageGroupUnit<T>;

/** `timestamp`'s fraction below millisecond precision (see notificationOrder). */
function subMillisecondFraction(timestamp: string): string {
  return (timestamp.match(/\.(\d+)/)?.[1] ?? "").slice(3).padEnd(6, "0");
}

/** True when `olderAt` is at most `MESSAGE_GROUP_WINDOW_MS` behind `newerAt`. */
function withinGroupWindow(newerAt: string, olderAt: string): boolean {
  const deltaMs = Date.parse(newerAt) - Date.parse(olderAt);
  if (deltaMs < MESSAGE_GROUP_WINDOW_MS) return true;
  if (deltaMs > MESSAGE_GROUP_WINDOW_MS) return false;
  // Equal milliseconds: the sub-millisecond fractions decide inclusivity.
  return subMillisecondFraction(newerAt) <= subMillisecondFraction(olderAt);
}

/**
 * Identity of an ordinary incoming chat-message notification, or null when
 * the row is not groupable (other type/screen, a reaction or future chat
 * event, or a missing/blank identity).
 */
export function getChatMessageIdentity(
  notification: GroupableNotification,
): ChatMessageIdentity | null {
  if (notification.type !== "message") return null;
  const data = notification.data;
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  const payload = data as Record<string, unknown>;
  if (payload.screen !== "chat") return null;
  // Reactions (data.event === 'reaction') and any unknown event stay single.
  if (payload.event !== undefined) return null;

  const conversationKey = payload.conversationKey;
  const senderId = payload.senderId;
  if (typeof conversationKey !== "string" || conversationKey.trim().length === 0) return null;
  if (typeof senderId !== "string" || senderId.trim().length === 0) return null;
  return { conversationKey, senderId };
}

/** A group while its members are still being collected (no identity yet). */
type MessageGroupDraft<T extends GroupableNotification> = Omit<
  MessageGroupUnit<T>,
  "key" | "id"
>;

/**
 * Newest-first feed units: ordinary chat messages from one conversation and
 * sender collapse into groups of two or more; lone messages and everything
 * else stay individual rows.
 * Every unit carries `id` + `created_at` so the existing local-date grouping
 * and ordering helpers can consume the result unchanged.
 */
export function groupNotificationFeed<T extends GroupableNotification>(
  notifications: readonly T[],
): NotificationFeedUnit<T>[] {
  const drafts: Array<NotificationFeedSingle<T> | MessageGroupDraft<T>> = [];
  const openGroups = new Map<string, MessageGroupDraft<T>>();

  for (const notification of sortNotificationsNewestFirst(notifications)) {
    const identity = getChatMessageIdentity(notification);
    if (!identity) {
      drafts.push({
        kind: "single",
        notification,
        id: notification.id,
        created_at: notification.created_at,
      });
      continue;
    }

    const conversationKey = `${identity.conversationKey}\u0000${identity.senderId}`;
    const open = openGroups.get(conversationKey);
    const oldest = open?.members[open.members.length - 1];
    if (open && oldest && withinGroupWindow(oldest.created_at, notification.created_at)) {
      open.members.push(notification);
      open.count = open.members.length;
      open.hasUnread = open.hasUnread || !notification.is_read;
      continue;
    }

    const group: MessageGroupDraft<T> = {
      kind: "message-group",
      conversationKey: identity.conversationKey,
      senderId: identity.senderId,
      members: [notification],
      latest: notification,
      count: 1,
      hasUnread: !notification.is_read,
      created_at: notification.created_at,
    };
    openGroups.set(conversationKey, group);
    drafts.push(group);
  }

  return drafts.map((unit) => {
    if (unit.kind === "single") return unit;
    // Collect the complete burst before deciding its presentation. A lone
    // message uses the normal row and its single-notification open behavior.
    if (unit.members.length === 1) {
      const notification = unit.latest;
      return {
        kind: "single",
        notification,
        id: notification.id,
        created_at: notification.created_at,
      };
    }
    // Identity is the oldest loaded member: Realtime arrivals append at the
    // newest end, so a group keeps its key (and expansion state) while that
    // member is still in the loaded feed.
    const oldestMemberId = unit.members[unit.members.length - 1].id;
    const key = `${unit.conversationKey}\u0000${unit.senderId}\u0000${oldestMemberId}`;
    return { ...unit, key, id: key };
  });
}

/** Summary line shared by the group row and its accessible name. */
export function formatMessageGroupCount(count: number): string {
  return `Sent you ${count} ${count === 1 ? "message" : "messages"}`;
}

export interface NotificationGroupLabelParts {
  senderName: string;
  count: number;
  latest?: string | null;
  isUnread: boolean;
}

/**
 * Accessible name for a group summary: the row is one button, so its label
 * spells out the sender, count, latest preview and unread state.
 */
export function composeNotificationGroupLabel({
  senderName,
  count,
  latest,
  isUnread,
}: NotificationGroupLabelParts): string {
  const parts: string[] = [senderName, formatMessageGroupCount(count)];

  if (latest) parts.push(`Latest: ${latest}`);
  if (isUnread) parts.push("unread");

  return parts.join(", ");
}
