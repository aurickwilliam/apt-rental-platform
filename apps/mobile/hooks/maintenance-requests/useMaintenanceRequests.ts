import { useMemo, useState } from "react";

export type MaintenanceRequestStatus = "Pending" | "In Progress" | "Resolved";
export type MaintenanceRequestUrgency = "Low" | "Medium" | "High";

export type MaintenanceRequest = {
  id: string;
  issue_title: string;
  apartment_name: string;
  apartment_address: string;
  tenant_name: string;
  tenant_avatar_url: string | null;
  contact_number: string;
  reported_at: string;
  urgency: MaintenanceRequestUrgency;
  status: MaintenanceRequestStatus;
  description: string;
  photos: string[];
};

export const STATUS_ORDER: Record<MaintenanceRequestStatus, number> = {
  Pending: 0,
  "In Progress": 1,
  Resolved: 2,
};

const getNextStatus = (
  status: MaintenanceRequestStatus
): MaintenanceRequestStatus => {
  if (status === "Pending") return "In Progress";
  if (status === "In Progress") return "Resolved";
  return "Resolved";
};

export function useMaintenanceRequests(initialRequests: MaintenanceRequest[]) {
  const [requests, setRequests] = useState<MaintenanceRequest[]>(initialRequests);

  const advanceStatus = (requestId: string) => {
    setRequests((prev) =>
      prev.map((request) =>
        request.id === requestId
          ? { ...request, status: getNextStatus(request.status) }
          : request
      )
    );
  };

  const sortedRequests = useMemo(() => {
    return [...requests].sort((a, b) => {
      const statusDiff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      if (statusDiff !== 0) return statusDiff;
      return (
        new Date(b.reported_at).getTime() - new Date(a.reported_at).getTime()
      );
    });
  }, [requests]);

  return { requests: sortedRequests, advanceStatus };
}
