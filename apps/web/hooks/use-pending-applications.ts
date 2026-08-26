"use client";

import { useEffect, useState, useCallback } from "react";
import { getApplications, deleteApplication, type StoredApplication } from "@/app/tenant/applications/lib/application-store";

export function usePendingApplications() {
  const [applications, setApplications] = useState<StoredApplication[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setApplications(getApplications());
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "apt.tenant_applications") refresh();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refresh]);

  const remove = useCallback(
    (id: string) => {
      deleteApplication(id);
      refresh();
    },
    [refresh]
  );

  return { applications, loading, refresh, remove };
}
