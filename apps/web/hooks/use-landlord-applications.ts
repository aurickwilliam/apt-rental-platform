"use client";

import { useCallback } from "react";

import { useAsyncResource } from "@/hooks/use-async-resource";
import { useAuthIdentity } from "@/hooks/use-auth-identity";
import {
  fetchLandlordApplications,
  getLandlordContext,
  type LandlordApplication,
} from "@/service/landlordApplicationsService";

export type { LandlordApplication };
export type DisplayStatus = LandlordApplication["status"];

const NO_APPLICATIONS: LandlordApplication[] = [];

export function useLandlordApplications(applicationId?: string) {
  const identity = useAuthIdentity();
  const load = useCallback(async () => {
    if (!identity.authUserId) return NO_APPLICATIONS;
    const context = await getLandlordContext();
    if (!context.landlordId) return NO_APPLICATIONS;
    return fetchLandlordApplications(applicationId);
  }, [identity, applicationId]);
  const { data, loading, error, refresh, revalidate, revalidating } = useAsyncResource(load, NO_APPLICATIONS, "Failed to load applications.", { clearOnRevalidateError: true });

  return { applications: loading || error ? NO_APPLICATIONS : data, loading: identity.authUserId === undefined || loading, error, refresh, revalidate, revalidating };
}
