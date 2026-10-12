"use client";

import { useCallback } from "react";

import { useAsyncResource } from "@/hooks/use-async-resource";
import {
  fetchLandlordApplications,
  getLandlordContext,
  type LandlordApplication,
} from "@/service/landlordApplicationsService";

export type { LandlordApplication };
export type DisplayStatus = LandlordApplication["status"];

const NO_APPLICATIONS: LandlordApplication[] = [];

export function useLandlordApplications() {
  const load = useCallback(async () => {
    const context = await getLandlordContext();
    if (!context.landlordId) return NO_APPLICATIONS;
    return fetchLandlordApplications();
  }, []);
  const { data, loading, error, refresh } = useAsyncResource(load, NO_APPLICATIONS, "Failed to load applications.");

  return { applications: data, loading, error, refresh };
}
