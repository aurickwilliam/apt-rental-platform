"use client";

import { useCallback } from "react";

import { useAsyncResource } from "@/hooks/use-async-resource";
import { useAuthIdentity } from "@/hooks/use-auth-identity";
import { matchesPresentationSeed, type PresentationSeed } from "@/service/presentation-seed";
import {
  fetchLandlordApplications,
  getLandlordContext,
  type LandlordApplication,
} from "@/service/landlordApplicationsService";

export type { LandlordApplication };
export type DisplayStatus = LandlordApplication["status"];

const NO_APPLICATIONS: LandlordApplication[] = [];

export function useLandlordApplications(applicationId?: string, initial?: PresentationSeed<LandlordApplication[]>) {
  const identity = useAuthIdentity(initial?.authUserId);
  const seed = matchesPresentationSeed(initial, identity, applicationId) ? initial : undefined;
  const load = useCallback(async () => {
    if (!identity.authUserId) return NO_APPLICATIONS;
    const context = await getLandlordContext();
    if (!context.landlordId) return NO_APPLICATIONS;
    return fetchLandlordApplications(applicationId, undefined, context.landlordId);
  }, [identity, applicationId]);
  const { data, loading, error, refresh, revalidate, revalidating } = useAsyncResource(load, NO_APPLICATIONS, "Failed to load applications.", { initial: seed, clearOnRevalidateError: true });

  return { applications: loading || error ? NO_APPLICATIONS : data, loading: identity.authUserId === undefined || loading, error, refresh, revalidate, revalidating };
}
