import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "heroui-native";
import { canChangeListingVisibility, type ListingVisibilityStatus } from "@repo/utils";
import { useCurrentUser } from "@/hooks/auth/useCurrentUser";
import { usePortalStore } from "@/stores/usePortalStore";
import { changeListingVisibility, type ListingVisibilityRequest } from "@/service/apartments/listingVisibilityService";
import type { ApartmentDetails } from "@/service/apartments/apartmentDetailsService";
import type { LandlordUnitsResult } from "@/service/landlord/landlordService";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { getApartmentDetailsQueryKey } from "./useApartmentDetails";
import { getLandlordUnitsQueryKey } from "./useLandlordUnits";

interface ListingVisibilityOptions {
  apartmentId: string;
  ownerId: string | null;
  status: string | undefined;
  hasActiveTenancy: boolean;
  tenancyReady: boolean;
}

const DISCOVERY_FAMILIES = ["searchSections", "searchSectionPage", "browseRowPage", "apartment-map-search"];

export function useListingVisibility({ apartmentId, ownerId, status, hasActiveTenancy, tenancyReady }: ListingVisibilityOptions) {
  const { data: user } = useCurrentUser();
  const portal = usePortalStore();
  const client = useQueryClient();
  const { toast } = useToast();
  const [isOpen, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scope, setScope] = useState({ apartmentId, ownerId, portal });
  if (scope.apartmentId !== apartmentId || scope.ownerId !== ownerId || scope.portal !== portal) {
    setScope({ apartmentId, ownerId, portal });
    setOpen(false);
    setError(null);
    setBusy(false);
  }
  const lifetime = useRef({ active: true, locked: false });
  useEffect(() => {
    const current = { active: true, locked: false };
    lifetime.current = current;
    return () => { current.active = false; };
  }, [apartmentId, ownerId, portal]);

  const allowed = !!user && user.id === ownerId && user.user_id === portal.authUserId
    && user.roles.includes("landlord") && user.account_status === "verified"
    && portal.portal === "landlord" && !portal.loading && tenancyReady
    && canChangeListingVisibility(status ?? "", hasActiveTenancy);
  const hidden = status === "under_maintenance";
  const label = hidden ? "Show Listing" : "Hide Listing";
  const mutation = useMutation({ mutationFn: (request: ListingVisibilityRequest) => changeListingVisibility(request), retry: false });

  function open() {
    if (!allowed || lifetime.current.locked) return;
    setError(null);
    setOpen(true);
  }

  function close() {
    if (lifetime.current.locked) return;
    setOpen(false);
    setError(null);
  }

  async function confirm() {
    const current = lifetime.current;
    if (!allowed || !isOpen || current.locked || !ownerId || !portal.authUserId
      || (status !== "available" && status !== "under_maintenance")) return;
    const isCurrent = () => current.active && usePortalStore.getState() === portal;
    current.locked = true;
    setBusy(true);
    setError(null);
    const detailsKey = getApartmentDetailsQueryKey(apartmentId);
    const unitsKey = getLandlordUnitsQueryKey(ownerId);
    try {
      await Promise.all([detailsKey, unitsKey].map(queryKey => client.cancelQueries({ queryKey, exact: true })));
      if (!isCurrent()) return;
      const nextStatus: ListingVisibilityStatus = await mutation.mutateAsync({ apartmentId, ownerId, authUserId: portal.authUserId, currentStatus: status, isCurrent });
      if (!isCurrent()) return;
      await Promise.all([detailsKey, unitsKey].map(queryKey => client.cancelQueries({ queryKey, exact: true })));
      if (!isCurrent()) return;
      client.setQueryData<ApartmentDetails>(detailsKey, previous => previous ? { ...previous, status: nextStatus } : previous);
      client.setQueryData<LandlordUnitsResult>(unitsKey, previous => previous ? {
        ...previous, apartments: previous.apartments.map(apartment => apartment.id === apartmentId ? { ...apartment, status: nextStatus } : apartment),
      } : previous);
      // The confirmed response paints immediately; mark exact existing reads
      // stale for revisits without a blocking refresh or unrelated refetches.
      const queries = client.getQueryCache().findAll().filter(query =>
        DISCOVERY_FAMILIES.includes(String(query.queryKey[0])));
      await Promise.all([detailsKey, unitsKey, ...queries.map(query => query.queryKey)]
        .map(queryKey => client.invalidateQueries({ queryKey, exact: true, refetchType: "none" })));
      if (!isCurrent()) return;
      setOpen(false);
      toast.show({ variant: "success", label: hidden ? "Listing shown" : "Listing hidden",
        description: hidden ? "The listing is available for browsing unless restricted by an administrator." : "Your property is hidden from browsing until you show it again." });
    } catch (failure) {
      if (!isCurrent()) return;
      console.error("Listing visibility update failed", failure instanceof Error ? failure.name : "DatabaseError");
      setError(getErrorMessage(failure, "Could not update listing visibility. Refresh this property before trying again."));
    } finally {
      current.locked = false;
      if (isCurrent()) setBusy(false);
    }
  }

  return { allowed, hidden, label, isOpen, busy, error, open, close, confirm };
}
