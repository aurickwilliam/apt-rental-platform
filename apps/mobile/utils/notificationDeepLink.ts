import type { Href } from "expo-router";

export interface NotificationData {
  screen?: string;
  apartmentId?: string;
  conversationKey?: string;
}

function parseConversationKey(key: string): { otherUserId: string; apartmentId: string | null } | null {
  const parts = key.split(":");
  // Format: chat:{apartmentId or 'none'}:{uuidA}:{uuidB}
  if (parts.length !== 4 || parts[0] !== "chat") return null;

  const apartmentId = parts[1] === "none" ? null : parts[1];
  return { otherUserId: parts[2], apartmentId };
}

/**
 * Resolves the navigation target encoded in a notification's data payload.
 * Unknown or unaddressable screens return null (callers no-op).
 */
export function buildNotificationDeepLink(
  data: unknown,
  currentUserId: string | null,
): Href | null {
  if (!data || typeof data !== "object") return null;

  const payload = data as NotificationData;

  switch (payload.screen) {
    case "chat": {
      const key = payload.conversationKey;
      if (!key || !currentUserId) return null;

      const parsed = parseConversationKey(key);
      if (!parsed || parsed.otherUserId === currentUserId) return null;

      return {
        pathname: "/chat/[conversationId]",
        params: {
          conversationId: key,
          otherUserId: parsed.otherUserId,
          otherUserPhoneNumber: "",
          apartmentId: parsed.apartmentId ?? "",
          apartmentTitle: "",
        },
      } as unknown as Href;
    }
    case "apartment":
      if (!payload.apartmentId) return null;
      return `/apartment/${payload.apartmentId}` as unknown as Href;
    case "maintenance":
      return "/tenant/maintenance-history" as Href;
    case "visitRequests":
      return "/landlord/visit-requests" as Href;
    default:
      return null;
  }
}
