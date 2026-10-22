import type { ConversationRole } from "./conversationService";

/**
 * Where "View profile" / "View apartment" lead from a chat. `role` is the
 * viewer's portal: in the tenant portal the other person is a landlord, and
 * vice versa. Shared by the Messages list and the chat header.
 */
export function getChatProfileRoute(
  role: ConversationRole,
  otherUserId: string,
  apartmentId: string | null
) {
  const apartmentParam = apartmentId ? { apartmentId } : {};
  return role === "tenant"
    ? {
        pathname: "/profile/landlord/[landlordId]" as const,
        params: { landlordId: otherUserId, ...apartmentParam },
      }
    : {
        pathname: "/profile/tenant/[tenantId]" as const,
        params: { tenantId: otherUserId, ...apartmentParam },
      };
}

export function getChatApartmentRoute(role: ConversationRole, apartmentId: string) {
  return role === "tenant"
    ? { pathname: "/apartment/[apartmentId]" as const, params: { apartmentId } }
    : {
        pathname: "/landlord/manage-apartment/[apartmentId]" as const,
        params: { apartmentId },
      };
}

/** The other person's role in the viewer's portal, for the chat header. */
/** Stable id for a pre-chat inquiry; shared by the apartment page and the landlord profile. */
export function getInquiryConversationId(
  landlordId: string,
  apartmentId?: string | null
): string {
  return apartmentId ? `inquiry-${apartmentId}-${landlordId}` : `inquiry-${landlordId}`;
}
