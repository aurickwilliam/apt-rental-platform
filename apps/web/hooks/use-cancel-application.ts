"use client";

import { useState } from "react";

import { cancelTenantApplication } from "@/service/tenantApplicationsService";

export function useCancelApplication() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancelApplication = async (applicationId: string, visitRequestId?: string) => {
    setLoading(true);
    setError(null);
    try {
      await cancelTenantApplication(applicationId, visitRequestId);
      return { error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to cancel application.";
      setError(msg);
      return { error: new Error(msg) };
    } finally {
      setLoading(false);
    }
  };

  return { cancelApplication, loading, error };
}
