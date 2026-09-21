"use client";

import { useState } from "react";

import { respondToVisitRequest } from "@/service/visitRequestsService";

export function useRespondToReschedule() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accept = async (visitRequestId: string) => {
    setLoading(true);
    setError(null);
    try {
      await respondToVisitRequest(visitRequestId, "approved");
      return { error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to accept visit.";
      setError(msg);
      return { error: new Error(msg) };
    } finally {
      setLoading(false);
    }
  };

  const decline = async (visitRequestId: string) => {
    setLoading(true);
    setError(null);
    try {
      await respondToVisitRequest(visitRequestId, "cancelled");
      return { error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to cancel visit.";
      setError(msg);
      return { error: new Error(msg) };
    } finally {
      setLoading(false);
    }
  };

  return { accept, decline, loading, error };
}
