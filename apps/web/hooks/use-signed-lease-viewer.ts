"use client";

import { useState } from "react";

import { createSignedLeaseUrl } from "@/service/signedLeaseService";

// Signed lease viewer shared by the landlord and tenant portals: the database
// stores the storage path, the browser opens a short-lived signed URL.
// Returns an error message on failure, null on success (nothing to view).
export function useSignedLeaseViewer() {
  const [viewing, setViewing] = useState(false);

  const viewSignedLease = async (path: string | null | undefined): Promise<string | null> => {
    if (!path) return null;
    setViewing(true);
    try {
      const url = await createSignedLeaseUrl(path);
      window.open(url, "_blank", "noopener,noreferrer");
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : "Could not open the signed lease. Please try again.";
    } finally {
      setViewing(false);
    }
  };

  return { viewSignedLease, viewing };
}
