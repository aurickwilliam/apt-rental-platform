import type { MaintenanceRequestStatus, MaintenanceRequestUrgency } from "./useMaintenanceRequests";
import { useStatusChipStyles } from "@/hooks/useStatusChipStyles";

type StatusStyle = ReturnType<typeof useStatusChipStyles>["success"];

export function useMaintenanceRequestStatusStyles(): Record<
  MaintenanceRequestStatus,
  StatusStyle
> {
  const status = useStatusChipStyles();
  return {
    Pending: status.warning,
    "In Progress": status.warning,
    Resolved: status.success,
    Cancelled: status.danger,
  };
}

export function useMaintenanceRequestUrgencyStyles(): Record<
  MaintenanceRequestUrgency,
  StatusStyle
> {
  const status = useStatusChipStyles();
  return {
    high: status.danger,
    medium: status.warning,
    low: status.neutral,
  };
}
