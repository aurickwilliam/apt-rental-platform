/**
 * Portal audience classification for notification feed rows.
 *
 * Rows carry no recipient-role column, so the audience is derived from the
 * exact payloads the server-side producers emit (see
 * supabase/migrations/20260814000000_create_notifications.sql and its
 * follow-ups). Each entry below cites the producer: (screen, title) pairs
 * are matched exactly — never by substring — and anything not listed falls
 * back to visible-in-both-portals so an unrecognized event is reported in
 * the open rather than silently hidden or misassigned.
 */

export type PortalAudience = "tenant" | "landlord" | "both" | "admin";

export type ActivePortal = "tenant" | "landlord" | "admin";

export interface AudienceNotification {
  type: string;
  title: string;
  data: unknown;
}

function screenOf(notification: AudienceNotification): string | null {
  if (!notification.data || typeof notification.data !== "object") return null;
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
  verification: new Set(["New account verification submitted"]),
  passportReview: new Set(["New passport document submitted"]),
};

/**
 * Account-level rows: the recipient is the account itself (or either side of
 * a conversation), so they are relevant in both portals.
 */
function isAccountLevel(screen: string | null, title: string): boolean {
  if (screen === "chat") return true;
  if (screen === "passport") return true;
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

  if (screen !== null) {
    if (ADMIN_TITLES[screen]?.has(title)) return "admin";
    if (TENANT_TITLES[screen]?.has(title)) return "tenant";
    if (LANDLORD_TITLES[screen]?.has(title)) return "landlord";
  }
  if (isAccountLevel(screen, title)) return "both";

  // Unknown producer or payload shape: stay visible everywhere. Hiding here
  // would silently drop events; misassigning would leak them across portals.
  return "both";
}

export function isNotificationVisibleInPortal(
  notification: AudienceNotification,
  portal: ActivePortal,
): boolean {
  const audience = getNotificationAudience(notification);
  return audience === "both" || audience === portal;
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
