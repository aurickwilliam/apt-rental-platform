import {
  getExplicitChatRecipientPortal,
  isChatNotification,
  type AudienceNotification,
  type ChatRecipientAudience,
} from "./notification-audience";

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
