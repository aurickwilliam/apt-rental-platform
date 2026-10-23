"use client";

import { useCallback } from "react";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { resolveMaintenanceImageUrls } from "@/service/maintenanceService";

const EMPTY = { key: "", urls: {} as Record<string, string | null>, error: null as string | null };

/** Mounted history only: photos never gate request metadata or action state. */
export function useMaintenancePhotoUrls(paths: string[]) {
  const key = JSON.stringify([...new Set(paths)].sort());
  const load = useCallback(async () => {
    const present = JSON.parse(key) as string[];
    if (!present.length) return { ...EMPTY, key };
    try {
      return { key, ...await resolveMaintenanceImageUrls(present) };
    } catch {
      console.error("Maintenance photos could not be loaded.");
      return { ...EMPTY, key, error: "Unable to access maintenance photos." };
    }
  }, [key]);
  const resource = useAsyncResource(load, EMPTY, "Unable to access maintenance photos.", { clearOnRevalidateError: true });
  return {
    urls: !resource.loading && resource.data.key === key ? resource.data.urls : EMPTY.urls,
    loading: paths.length > 0 && resource.loading,
    error: resource.data.key === key ? resource.data.error : null,
  };
}
