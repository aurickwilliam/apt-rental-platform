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

// --- Chat recipient resolution (read-time, never persisted) ---

interface RecipientNotification extends AudienceNotification {
  user_id: string;
}

export interface NotificationApartmentOwner {
  id: string;
  landlord_id: string | null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function uuid(value: unknown): string | null {
  return typeof value === "string" && UUID.test(value) ? value.toLowerCase() : null;
}

function legacyRelationship(notification: RecipientNotification, recipientId: string) {
  if (notification.user_id !== recipientId || !isChatNotification(notification) ||
      getExplicitChatRecipientPortal(notification.data) !== null) return null;
  const data = notification.data;
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  const payload = data as Record<string, unknown>;
  const apartmentId = uuid(payload.apartmentId);
  const peerId = uuid(payload.senderId);
  const recipient = uuid(recipientId);
  if (!apartmentId || !peerId || !recipient || peerId === recipient) return null;
  return { apartmentId, peerId, recipient };
}

/** At most one id per distinct resolvable legacy apartment in the bounded feed. */
export function getLegacyChatApartmentIds(
  notifications: readonly RecipientNotification[],
  recipientId: string,
): string[] {
  const ids = new Set<string>();
  for (const notification of notifications) {
    const relationship = legacyRelationship(notification, recipientId);
    if (relationship) ids.add(relationship.apartmentId);
  }
  return [...ids];
}

/**
 * Resolve before publishing the shared account feed, never per portal/render.
 * senderId is the peer (ordinary sender or reactor); for reactions the
 * notification recipient is the original author, not the original receiver.
 * Only an owner who is one of these two participants proves a role. No
 * membership, preview text, selected UI, or active-tenancy inference is used.
 */
export function resolveChatNotificationAudiences<T extends RecipientNotification>(
  notifications: readonly T[],
  recipientId: string,
  apartments: readonly NotificationApartmentOwner[],
): Array<T & { resolvedChatAudience?: ChatRecipientAudience }> {
  const owners = new Map<string, string | null>();
  for (const apartment of apartments) {
    const id = uuid(apartment.id);
    if (!id) continue;
    const owner = uuid(apartment.landlord_id);
    // Conflicting evidence is unresolved, even if one row matches a party.
    owners.set(id, owners.has(id) && owners.get(id) !== owner ? null : owner);
  }
  return notifications.map((notification) => {
    if (!isChatNotification(notification)) return notification;
    let resolvedChatAudience: ChatRecipientAudience = "unresolved";
    if (notification.user_id === recipientId) {
      const explicit = getExplicitChatRecipientPortal(notification.data);
      const relationship = legacyRelationship(notification, recipientId);
      if (explicit !== null) resolvedChatAudience = explicit;
      else if (relationship) {
        const owner = owners.get(relationship.apartmentId);
        if (owner === relationship.recipient) resolvedChatAudience = "landlord";
        else if (owner === relationship.peerId) resolvedChatAudience = "tenant";
      }
    }
    return { ...notification, resolvedChatAudience };
  });
}

/**
 * Resolves chat audiences for a feed: one bounded ownership lookup for the
 * distinct legacy apartments (none when nothing needs it), through the
 * caller's own fetcher so each platform keeps its Supabase client. A failed
 * lookup leaves legacy chat unresolved (hidden everywhere) and reports once
 * through `onError`, which must not carry message text or other PII.
 */
export async function resolveChatAudiencesWith<T extends RecipientNotification>(
  notifications: readonly T[],
  recipientId: string,
  fetchOwners: (apartmentIds: string[]) => Promise<readonly NotificationApartmentOwner[]>,
  onError?: () => void,
): Promise<Array<T & { resolvedChatAudience?: ChatRecipientAudience }>> {
  const apartmentIds = getLegacyChatApartmentIds(notifications, recipientId);
  if (apartmentIds.length === 0) {
    return resolveChatNotificationAudiences(notifications, recipientId, []);
  }

  try {
    const owners = await fetchOwners(apartmentIds);
    return resolveChatNotificationAudiences(notifications, recipientId, owners);
  } catch {
    onError?.();
    return resolveChatNotificationAudiences(notifications, recipientId, []);
  }
}
