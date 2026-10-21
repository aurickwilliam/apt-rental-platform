import {
  getNotificationAudience,
  isNotificationVisibleInPortal,
  type ActivePortal,
  type AudienceNotification,
  type UnreadNotification,
} from "./notification-audience";

export type SidebarActivityKey =
  | "rental" | "applications" | "payments" | "maintenance"
  | "messages" | "passport" | "properties" | "verification";

type ActivityNotification = AudienceNotification & UnreadNotification;

/** Exactly one relevant destination, or none. Never infer from message body or URL. */
export function getSidebarActivityKey(
  notification: ActivityNotification,
  portal: ActivePortal,
): SidebarActivityKey | null {
  if (!isNotificationVisibleInPortal(notification, portal)) return null;
  const data = notification.data;
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  const payload = data as Record<string, unknown>;
  const hasId = (key: string) => typeof payload[key] === "string" && payload[key].trim().length > 0;
  const audience = getNotificationAudience(notification);

  if (portal === "admin") {
    if (audience !== "admin") return null;
    if (payload.screen === "passportReview" && hasId("documentId")) return "verification";
    if (payload.screen === "verification" && hasId("verificationId") !== hasId("apartmentId")) return "verification";
    return null;
  }

  switch (payload.screen) {
    case "chat":
      return notification.type === "message" ? "messages" : null;
    case "maintenance":
      return notification.type === "maintenance" ? "maintenance" : null;
    case "payments":
      return notification.type === "payment" ? portal === "tenant" ? "rental" : "payments" : null;
    case "apartment":
      return portal === "tenant" && audience === "tenant" && hasId("apartmentId") ? "rental" : null;
    case "visitRequests":
      // Landlord visit requests have no matching sidebar item.
      return portal === "tenant" && audience === "tenant" ? "rental" : null;
    case "application":
      return portal === "landlord" && audience === "landlord" && hasId("applicationId") ? "applications" : null;
    case "passport":
      // Do not reinterpret legacy admin-submission rows as own-wallet activity.
      return hasId("documentId") && notification.title !== "New passport document submitted" ? "passport" : null;
    case "verification":
      if (hasId("apartmentId") && !hasId("verificationId")) {
        return portal === "landlord" && audience === "landlord" ? "properties" : null;
      }
      if (hasId("verificationId") && !hasId("apartmentId") && (
        notification.title === "Account verification approved" || notification.title === "Account verification rejected"
      )) return "passport";
      return null;
    default:
      return null;
  }
}

/** Boolean activity, not chat-unread totals or pending verification workload. */
export function getUnreadSidebarActivity(
  notifications: readonly ActivityNotification[],
  portal: ActivePortal | null,
): ReadonlySet<SidebarActivityKey> {
  const activity = new Set<SidebarActivityKey>();
  const seen = new Set<string>();
  if (!portal) return activity;
  for (const notification of notifications) {
    if (notification.is_read || seen.has(notification.id)) continue;
    seen.add(notification.id);
    const key = getSidebarActivityKey(notification, portal);
    if (key) activity.add(key);
  }
  return activity;
}
