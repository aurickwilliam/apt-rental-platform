import { useQuery } from "@tanstack/react-query";

import { useCurrentUserId } from "@/hooks/auth";
import { fetchChatApartmentContext } from "@/service/chat/chatApartmentService";

/**
 * The apartment card for an inquiry chat: null when the chat has no
 * apartment, the apartment is gone, or the two already share an active
 * tenancy there (a current tenant ↔ landlord chat shows no card).
 */
export function useChatApartment(apartmentId: string | null, otherUserId: string) {
  const myId = useCurrentUserId();

  const query = useQuery({
    queryKey: ["chat-apartment", myId, apartmentId, otherUserId],
    queryFn: () => fetchChatApartmentContext(apartmentId as string, myId as string, otherUserId),
    enabled: Boolean(myId && apartmentId && otherUserId),
  });

  if (!query.data || query.data.hasActiveTenancy) return null;
  return query.data.apartment;
}
