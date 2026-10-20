/**
 * Portal audience classification for notification feed rows.
 *
 * Rows carry no recipient-role column, so the audience is derived from the
 * exact payloads the server-side producers emit (see
 * supabase/migrations/20260814000000_create_notifications.sql and its
 * follow-ups). Each entry below cites the producer: (screen, title) pairs
 * are matched exactly — never by substring — and anything not listed falls
 * back to visible in the two consumer portals, not Admin. Consumer-shared
 * activity is distinct from explicitly recognized account-wide events. Chat
 * instead requires an explicit or ownership-resolved recipient audience.
 */

export type ChatRecipientAudience = "tenant" | "landlord" | "unresolved";
export type PortalAudience = "tenant" | "landlord" | "both" | "admin" | "account" | "unresolved";

export type ActivePortal = "tenant" | "landlord" | "admin";

export interface AudienceNotification {
  type: string;
  title: string;
  data: unknown;
  /** Read-time ownership resolution only; never written to notifications. */
  resolvedChatAudience?: ChatRecipientAudience;
}

/** Chat remains identifiable even when legacy rows lost their screen/type. */
export function isChatNotification(notification: AudienceNotification): boolean {
  const data = notification.data;
  const payload = data && typeof data === "object" && !Array.isArray(data)
    ? data as Record<string, unknown>
    : {};
  return notification.type === "message" || payload.screen === "chat" || payload.event === "reaction";
}

/** Absent metadata permits legacy resolution; invalid metadata fails closed. */
export function getExplicitChatRecipientPortal(data: unknown): ChatRecipientAudience | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  const payload = data as Record<string, unknown>;
  if (!("recipientPortal" in payload)) return null;
  return payload.recipientPortal === "tenant" || payload.recipientPortal === "landlord"
    ? payload.recipientPortal
    : "unresolved";
}

function screenOf(notification: AudienceNotification): string | null {
  if (!notification.data || typeof notification.data !== "object" || Array.isArray(notification.data)) return null;
  const screen = (notification.data as { screen?: unknown }).screen;
  return typeof screen === "string" ? screen : null;
}

/** Exact producer titles, grouped by the role that receives them. */
const TENANT_TITLES: Record<string, Set<string>> = {
  payments: new Set([
    "Payment Successful",
    "Rent Due Soon",
    "Rent Due Today",
    "Rent Past Due",
  ]),
  maintenance: new Set([
    "Maintenance In Progress",
    "Maintenance Resolved",
    "Maintenance Cancelled",
    "Maintenance Update",
  ]),
  apartment: new Set(["Application Approved", "Application Rejected"]),
  visitRequests: new Set([
    "Visit Approved",
    "Visit Rejected",
    "Visit Rescheduled",
    "Visit Cancelled",
    "Visit Update",
  ]),
};

const LANDLORD_TITLES: Record<string, Set<string>> = {
  verification: new Set(["Apartment verification approved", "Apartment verification rejected"]),
  payments: new Set([
    "Payment Received",
    "Cash Payment Received",
    "Tenant Rent Due Soon",
    "Tenant Rent Due Today",
    "Tenant Rent Overdue",
  ]),
  maintenance: new Set(["New Maintenance Request"]),
  application: new Set(["New Application"]),
  visitRequests: new Set(["New Visit Request"]),
};

/** Titles produced for admin recipients (no consumer-portal drawer in scope). */
const ADMIN_TITLES: Record<string, Set<string>> = {
  verification: new Set(["New account verification submitted", "New apartment verification submitted"]),
  passportReview: new Set(["New passport document submitted"]),
};

/**
 * Exact account-level producer events, relevant across all three portals.
 * Own-wallet Passport activity is consumer-shared; chat is role-specific.
 */
function isAccountLevel(screen: string | null, title: string): boolean {
  if (screen === "verification") {
    return (
      title === "Account verification approved" ||
      title === "Account verification rejected"
    );
  }
  return false;
}

export function getNotificationAudience(
  notification: AudienceNotification,
): PortalAudience {
  const screen = screenOf(notification);
  const title = notification.title ?? "";

  // Ordinary messages and reactions share type='message', screen='chat'.
  // The type also identifies legacy/malformed chat rows with a missing screen;
  // the event identifies reactions even when that type/screen was lost.
  const data = notification.data;
  const payload = data && typeof data === "object" && !Array.isArray(data)
    ? data as Record<string, unknown>
    : {};
  if (isChatNotification(notification)) {
    return notification.resolvedChatAudience ?? getExplicitChatRecipientPortal(data) ?? "unresolved";
  }

  if (screen !== null) {
    if (ADMIN_TITLES[screen]?.has(title)) return "admin";
    if (TENANT_TITLES[screen]?.has(title)) return "tenant";
    if (LANDLORD_TITLES[screen]?.has(title)) return "landlord";
  }
  if (isAccountLevel(screen, title)) return "account";

  // A known destination remains scoped even when its title/subtype changes.
  if (screen === "passportReview") return "admin";
  if (screen === "application" || screen === "payouts") return "landlord";
  if (screen === "apartment") return "tenant";

  // Honor explicit role metadata on otherwise unrecognized events. These
  // fields must not turn consumer messages into account-wide/Admin activity.
  if (payload.portal === "tenant" || payload.audience === "tenant") return "tenant";
  if (payload.portal === "landlord" || payload.audience === "landlord") return "landlord";
  // Consumer destination/type evidence wins over a contradictory admin hint.
  const consumerScreen = screen === "payments" || screen === "maintenance" ||
    screen === "visitRequests" || screen === "passport" || screen === "verification";
  const consumerType = notification.type === "payment" || notification.type === "maintenance" ||
    notification.type === "apartment";
  if (!consumerScreen && !consumerType && (payload.portal === "admin" || payload.audience === "admin")) return "admin";

  // Unknown events retain the existing consumer fallback. Admin requires an
  // identifiable review responsibility or known account-wide event instead
  // of assuming that "unknown" means "account-wide".
  return "both";
}

export function isNotificationVisibleInPortal(
  notification: AudienceNotification,
  portal: ActivePortal,
): boolean {
  const audience = getNotificationAudience(notification);
  return audience === "account" || audience === portal ||
    (audience === "both" && portal !== "admin");
}

export interface UnreadNotification {
  id: string;
  is_read: boolean;
}

/** Portal-visible unread ids. Powers the badge and scoped mark-all-read. */
export function getVisibleUnreadIds<T extends AudienceNotification & UnreadNotification>(
  notifications: T[],
  portal: ActivePortal,
): string[] {
  return notifications
    .filter((n) => !n.is_read && isNotificationVisibleInPortal(n, portal))
    .map((n) => n.id);
}
