import type { Href } from "expo-router";

import type { UserProfile } from "@/service/currentUserService";

export interface NotificationData {
  screen?: string;
  apartmentId?: string;
  conversationKey?: string;
  paymentId?: string;
  senderId?: string;
  senderAvatarUrl?: string;
}

type Role = UserProfile["role"];

function parseConversationKey(key: string): { userIdA: string; userIdB: string; apartmentId: string | null } | null {
  const parts = key.split(":");
  // Format: chat:{apartmentId or 'none'}:{uuidA}:{uuidB}
  // Participants are stored sorted (least:greatest), not by role.
  if (parts.length !== 4 || parts[0] !== "chat") return null;

  const apartmentId = parts[1] === "none" ? null : parts[1];
  return { userIdA: parts[2], userIdB: parts[3], apartmentId };
}

/**
 * Resolves the navigation target encoded in a notification's data payload,
 * branching on the recipient's role where landlord and tenant destinations
 * differ. Unknown or unaddressable screens return null (callers no-op).
 */
export function buildNotificationDeepLink(
  data: unknown,
  currentUserId: string | null,
  role: Role | null,
): Href | null {
  if (!data || typeof data !== "object") return null;

  const payload = data as NotificationData;

  switch (payload.screen) {
    case "chat": {
      const key = payload.conversationKey;
      if (!key || !currentUserId) return null;

      const parsed = parseConversationKey(key);
      if (!parsed) return null;

      // The "other" participant is whichever one is not the current user
      // (participants are stored sorted as least:greatest).
      const otherUserId =
        parsed.userIdA === currentUserId ? parsed.userIdB : parsed.userIdA;
      if (otherUserId === currentUserId) return null;

      return {
        pathname: "/chat/[conversationId]",
        params: {
          conversationId: key,
          otherUserId,
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
      if (role === "landlord") return "/landlord/maintenance-requests" as Href;
      if (!payload.apartmentId) return null;
      return {
        pathname: "/tenant/maintenance-history",
        params: { apartmentId: payload.apartmentId },
      } as unknown as Href;
    case "visitRequests":
      if (role === "tenant") return "/tenant/applications" as Href;
      return "/landlord/visit-requests" as Href;
    case "payments":
      if (role === "landlord") {
        if (!payload.apartmentId) return null;
        return `/landlord/manage-apartment/${payload.apartmentId}/payment-history` as unknown as Href;
      }
      if (payload.paymentId) {
        return {
          pathname: "/tenant/payment/history/[paymentId]",
          params: { paymentId: payload.paymentId },
        } as unknown as Href;
      }
      return "/tenant/payment/history" as Href;
    default:
      return null;
  }
}