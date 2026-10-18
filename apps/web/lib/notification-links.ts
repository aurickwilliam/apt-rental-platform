/**
 * Portal-aware deep links for notification feed rows.
 *
 * Every destination below is an existing web route (verified against
 * app/tenant, app/landlord, and the admin verification review pages).
 * Rows whose payload cannot address a route in the active portal resolve to
 * null so the row renders read-only instead of navigating somewhere broken.
 */

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
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function payloadOf(data: unknown): LinkNotificationData {
  if (!data || typeof data !== "object") return {};
  return data as LinkNotificationData;
}

export function resolveNotificationHref(
  data: unknown,
  portal: ActivePortal,
): string | null {
  const payload = payloadOf(data);
  if (typeof payload.screen !== "string") return null;

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
        return paymentId ? `/landlord/payments/${paymentId}` : "/landlord/payments";
      }
      if (portal === "tenant") {
        // No tenant payment-detail route exists; the history list is the target.
        return "/tenant/payment/history";
      }
      // No admin payment surface; admin payment rows stay hidden by audience.
      return null;
    case "maintenance":
      if (portal === "landlord") {
        return maintenanceId
          ? `/landlord/maintenance-requests/${maintenanceId}`
          : "/landlord/maintenance-requests";
      }
      if (portal === "tenant") return "/tenant/maintenance";
      return null;
    case "apartment":
      // Tenant application outcomes land on the apartment. Landlord rows
      // never carry this screen (theirs is 'application').
      if (portal !== "tenant" || !apartmentId) return null;
      return `/tenant/browse/${apartmentId}`;
    case "application":
      if (portal !== "landlord") return null;
      return applicationId
        ? `/landlord/applications/${applicationId}`
        : "/landlord/applications";
    case "visitRequests":
      if (portal === "landlord") {
        return visitRequestId
          ? `/landlord/visit-requests/${visitRequestId}`
          : "/landlord/visit-requests";
      }
      if (portal === "tenant") return "/tenant/applications";
      return null;
    case "chat":
      // The payload conversationKey uses the mobile key format, which web
      // thread routes do not accept — land on the portal inbox instead.
      // Admins have no inbox; their chat rows stay read-only.
      if (portal === "landlord") return "/landlord/messages";
      if (portal === "tenant") return "/tenant/messages";
      return null;
    case "verification":
      // Review outcomes land on the recipient's portal profile. Submitted
      // verifications notify admins and deep-link to the review queue by
      // verification row id.
      if (portal === "admin") {
        return verificationId
          ? `/admin/verification/users/${verificationId}`
          : "/admin/verification";
      }
      return portal === "landlord" ? "/landlord/profile" : "/tenant/profile";
    case "passport":
      // Own documents land on the portal wallet. Admins have no wallet;
      // their rows stay read-only.
      if (portal === "landlord") {
        return documentId ? `/landlord/passport/${documentId}` : "/landlord/passport";
      }
      if (portal === "tenant") {
        return documentId ? `/tenant/passport/${documentId}` : "/tenant/passport";
      }
      return null;
    case "passportReview":
      // Admin-only review queue, keyed by passport-document row id.
      if (portal !== "admin") return null;
      return documentId
        ? `/admin/verification/documents/${documentId}`
        : "/admin/verification";
    default:
      return null;
  }
}
