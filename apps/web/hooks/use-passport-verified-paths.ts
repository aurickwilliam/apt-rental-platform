"use client";

import { useEffect, useState } from "react";

import { fetchPassportVerifiedPaths } from "@/service/applicationDocumentsService";

/**
 * Resolves which of the given storage paths are verified passport documents
 * for a tenant. Used to badge verified attachments in landlord views.
 */
export function usePassportVerifiedPaths(
  tenantId: string | null,
  paths: readonly string[],
) {
  const [verified, setVerified] = useState<Set<string>>(new Set());
  const pathsKey = [...new Set(paths.filter(Boolean))].sort().join("\u0001");

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const result =
        tenantId && pathsKey.length > 0
          ? await fetchPassportVerifiedPaths(tenantId, pathsKey.split("\u0001"))
          : new Set<string>();
      if (!cancelled) setVerified(result);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [tenantId, pathsKey]);

  return verified;
}
