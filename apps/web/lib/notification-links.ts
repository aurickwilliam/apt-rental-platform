/**
 * Portal-aware deep links for notification feed rows.
 *
 * Every destination below is an existing web route (verified against
 * app/tenant, app/landlord, and the admin verification review pages).
 * Rows whose payload cannot address a route in the active portal resolve to
 * `href: null` so the row renders read-only instead of navigating somewhere
 * broken.
 *
 * Chat rows additionally report `conversationTargeted`: true only when the
 * payload named the peer and an exact thread URL was built. The drawer uses
 * it to acknowledge a grouped burst only once the intended conversation —
 * never the inbox fallback — was resolved.
 */

import { getContactConversationKey } from "./conversation-contacts";
import type { ActivePortal } from "./notification-audience";

export interface LinkNotificationData {
  screen?: unknown;
  apartmentId?: unknown;
  paymentId?: unknown;
  maintenanceId?: unknown;
  applicationId?: unknown;
  visitRequestId?: unknown;
  documentId?: unknown;
  verificationId?: unknown;
  senderId?: unknown;
}

export interface NotificationTarget {
  /** Route to open, or null when the payload addresses nothing in this portal. */
  href: string | null;
  /** True only when `href` opens the exact chat conversation the payload names. */
  conversationTargeted: boolean;
}

const NO_TARGET: NotificationTarget = { href: null, conversationTargeted: false };

function target(href: string | null): NotificationTarget {
  return { href, conversationTargeted: false };
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function payloadOf(data: unknown): LinkNotificationData {
  if (!data || typeof data !== "object") return {};
  return data as LinkNotificationData;
}

/**
 * Thread URL for a chat payload, built in the web conversation key format
 * (`{peerId}:{apartmentId|'none'}`, see ARCHITECTURE.md §8.1). The mobile
 * `conversationKey` in the payload is intentionally ignored: it encodes
 * sorted participant ids, which web thread routes do not accept. Without a
 * peer id there is no thread to address and the caller falls back to the
 * portal inbox.
 */
function chatConversationHref(
  payload: LinkNotificationData,
  portal: ActivePortal,
): string | null {
  if (portal === "admin") return null;
  const peerId = text(payload.senderId);
  if (!peerId) return null;
  const conversationKey = getContactConversationKey(peerId, text(payload.apartmentId));
  return `/${portal === "landlord" ? "landlord" : "tenant"}/messages?conversation=${conversationKey}`;
}

export function resolveNotificationTarget(
  data: unknown,
  portal: ActivePortal,
): NotificationTarget {
  const payload = payloadOf(data);
  if (typeof payload.screen !== "string") return NO_TARGET;

  const apartmentId = text(payload.apartmentId);
  const paymentId = text(payload.paymentId);
  const maintenanceId = text(payload.maintenanceId);
  const applicationId = text(payload.applicationId);
  const visitRequestId = text(payload.visitRequestId);
  const documentId = text(payload.documentId);
  const verificationId = text(payload.verificationId);

  switch (payload.screen) {
    case "payments":
      if (portal === "landlord") {
        return target(paymentId ? `/landlord/payments/${paymentId}` : "/landlord/payments");
      }
      if (portal === "tenant") {
        // No tenant payment-detail route exists; the history list is the target.
        return target("/tenant/payment/history");
      }
      // No admin payment surface; admin payment rows stay hidden by audience.
      return NO_TARGET;
    case "maintenance":
      if (portal === "landlord") {
        return target(
          maintenanceId
            ? `/landlord/maintenance-requests/${maintenanceId}`
            : "/landlord/maintenance-requests",
        );
      }
      if (portal === "tenant") return target("/tenant/maintenance");
      return NO_TARGET;
    case "apartment":
      // Tenant application outcomes land on the apartment. Landlord rows
      // never carry this screen (theirs is 'application').
      if (portal !== "tenant" || !apartmentId) return NO_TARGET;
      return target(`/tenant/browse/${apartmentId}`);
    case "application":
      if (portal !== "landlord") return NO_TARGET;
      return target(
        applicationId ? `/landlord/applications/${applicationId}` : "/landlord/applications",
      );
    case "visitRequests":
      if (portal === "landlord") {
        return target(
          visitRequestId
            ? `/landlord/visit-requests/${visitRequestId}`
            : "/landlord/visit-requests",
        );
      }
      if (portal === "tenant") return target("/tenant/applications");
      return NO_TARGET;
    case "chat": {
      const conversationHref = chatConversationHref(payload, portal);
      if (conversationHref) {
        return { href: conversationHref, conversationTargeted: true };
      }
      // No peer identity in the payload (or an admin, who has no inbox):
      // land on the portal inbox when one exists.
      if (portal === "landlord") return target("/landlord/messages");
      if (portal === "tenant") return target("/tenant/messages");
      return NO_TARGET;
    }
    case "verification":
      // Review outcomes land on the recipient's portal profile. Submitted
      // verifications notify admins and deep-link to the review queue by
      // verification row id.
      if (portal === "admin") {
        return target(
          verificationId ? `/admin/verification/users/${verificationId}` : "/admin/verification",
        );
      }
      return target(portal === "landlord" ? "/landlord/profile" : "/tenant/profile");
    case "passport":
      // Own documents land on the portal wallet. Admins have no wallet;
      // their rows stay read-only.
      if (portal === "landlord") {
        return target(documentId ? `/landlord/passport/${documentId}` : "/landlord/passport");
      }
      if (portal === "tenant") {
        return target(documentId ? `/tenant/passport/${documentId}` : "/tenant/passport");
      }
      return NO_TARGET;
    case "passportReview":
      // Admin-only review queue, keyed by passport-document row id.
      if (portal !== "admin") return NO_TARGET;
      return target(
        documentId ? `/admin/verification/documents/${documentId}` : "/admin/verification",
      );
    default:
      return NO_TARGET;
  }
}
