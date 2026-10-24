import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchReviewUnlock, type ReviewUnlockCandidate } from "@/service/ratings/reviewUnlockService";
import { markReviewUnlockSeen } from "@/service/ratings/reviewUnlockStorage";
import { usePortalStore } from "@/stores/usePortalStore";

export const getReviewUnlockQueryKey = (authUserId: string, tenantId: string) =>
  ["review-unlock", authUserId, tenantId] as const;

/** Mounted under an account-keyed gate. Show at most one prompt per mount. */
export function useReviewUnlock(authUserId: string, tenantId: string, enabled: boolean) {
  const [dismissed, setDismissed] = useState(false);
  const mounted = useRef(true);
  const handled = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  const hasAccess = useCallback(() => {
    const portal = usePortalStore.getState();
    return mounted.current && portal.authUserId === authUserId && portal.portal === "tenant" && !portal.loading;
  }, [authUserId]);
  const query = useQuery({
    queryKey: getReviewUnlockQueryKey(authUserId, tenantId),
    queryFn: ({ signal }) => hasAccess() ? fetchReviewUnlock(authUserId, tenantId, signal) : null,
    enabled: enabled && !dismissed && hasAccess(),
    // Do not display a stale offer before rechecking reviewed/deleted stays.
    staleTime: 0,
    refetchOnMount: "always",
  });
  useEffect(() => {
    if (query.error) console.warn("Could not check review prompt eligibility.");
  }, [query.error]);
  const candidate = enabled && !dismissed && !query.isFetching && !query.isError && hasAccess() ? query.data ?? null : null;

  const dismiss = (offer: ReviewUnlockCandidate): boolean => {
    if (!hasAccess() || handled.current) return false;
    handled.current = true;
    setDismissed(true);
    void markReviewUnlockSeen(authUserId, offer.tenancyId).catch(() => {
      // Keep it dismissed in memory even if the device cannot persist it.
      console.warn("Could not save review prompt dismissal.");
    });
    return true;
  };
  return { candidate, dismiss };
}
