import { compareNotificationsNewestFirst } from "@repo/utils";
import { isNotificationVisibleInPortal, type ActivePortal } from "./notification-audience";
import type { FeedNotification } from "../service/notificationService";

export interface ViewedConversationWindow {
  viewerId: string;
  peerId: string;
  apartmentId: string | null;
  through: string;
  /** Verified message timestamps with no unread same-timestamp siblings. */
  readTimestamps: string[];
  messageIds: string[];
  unreadCount: number;
}

/** Negative means a is newer. Retains Postgres sub-millisecond precision. */
export function compareReadTimestamps(a: string, b: string): number {
  return compareNotificationsNewestFirst({ id: "", created_at: a }, { id: "", created_at: b });
}

function payload(data: unknown): Record<string, unknown> | null {
  return data && typeof data === "object" && !Array.isArray(data) ? data as Record<string, unknown> : null;
}

function canonicalConversation(view: ViewedConversationWindow): string {
  return `chat:${view.apartmentId ?? "none"}:${[view.viewerId, view.peerId].sort().join(":")}`;
}

/** Structured context only. Missing/conflicting legacy identities stay manual. */
export function conversationNotificationReadIds(
  notifications: readonly FeedNotification[], portal: ActivePortal, view: ViewedConversationWindow,
): string[] {
  if (portal === "admin" || !Number.isFinite(Date.parse(view.through))) return [];
  return notifications.filter(row => {
    if (row.is_read || row.user_id !== view.viewerId || row.type !== "message" || !isNotificationVisibleInPortal(row, portal)) return false;
    const data = payload(row.data);
    if (!data || data.screen !== "chat" || "event" in data || data.senderId !== view.peerId) return false;
    const hasApartment = Object.hasOwn(data, "apartmentId");
    if (hasApartment && data.apartmentId !== view.apartmentId) return false;
    if (data.conversationKey !== undefined && data.conversationKey !== canonicalConversation(view)) return false;
    if (data.conversationKey === undefined && !hasApartment) return false;
    if (data.messageId !== undefined) return typeof data.messageId === "string" && view.messageIds.includes(data.messageId);
    if (!Number.isFinite(Date.parse(row.created_at))) return false;
    // Legacy triggers use one transaction timestamp for chat + notification.
    // Never guess a broad conversation cutoff: unseen same-timestamp siblings
    // block that timestamp, and an unmatched legacy timestamp stays manual.
    return view.readTimestamps.some(time => compareReadTimestamps(row.created_at, time) === 0);
  }).map(row => row.id);
}

export interface ViewedNotificationEntity {
  field: "applicationId" | "paymentId" | "maintenanceId" | "visitRequestId" | "verificationId" | "documentId";
  id: string;
  screen: string;
  /** Database revision time of the successfully loaded detail, not Date.now(). */
  through: string;
}

export function entityNotificationReadIds(
  notifications: readonly FeedNotification[], viewerId: string, portal: ActivePortal, entity: ViewedNotificationEntity,
): string[] {
  if (!entity.id || !Number.isFinite(Date.parse(entity.through))) return [];
  return notifications.filter(row => {
    const data = payload(row.data);
    return !row.is_read && row.user_id === viewerId && isNotificationVisibleInPortal(row, portal) &&
      data?.screen === entity.screen && data[entity.field] === entity.id &&
      Number.isFinite(Date.parse(row.created_at)) && compareReadTimestamps(row.created_at, entity.through) >= 0;
  }).map(row => row.id);
}
