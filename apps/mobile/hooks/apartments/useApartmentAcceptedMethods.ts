import { useQuery } from "@tanstack/react-query";
import { fetchAcceptedMethodsForApartment } from "@/service/payments/acceptedMethodsService";

export const getApartmentAcceptedMethodsQueryKey = (apartmentId: string | null) =>
  ["apartment-accepted-methods", apartmentId] as const;

// The payment methods an apartment's landlord accepts, for the apartment page. Display only: a
// failed or missing read just leaves the section out, and checkout enforces the real list.
export function useApartmentAcceptedMethods(apartmentId: string | null) {
  return useQuery({
    queryKey: getApartmentAcceptedMethodsQueryKey(apartmentId),
    queryFn: ({ signal }) => fetchAcceptedMethodsForApartment(apartmentId as string, signal),
    enabled: apartmentId !== null,
  });
}
