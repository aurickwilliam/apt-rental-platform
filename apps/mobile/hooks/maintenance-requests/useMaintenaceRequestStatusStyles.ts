import type { MaintenanceRequestStatus } from "./useMaintenanceRequests";

import { useColors } from "@/hooks/useTheme";

type StatusStyle = { backgroundColor: string; textColor: string };

export function useMaintenanceRequestStatusStyles(): Record<
  MaintenanceRequestStatus,
  StatusStyle
> {
  const { colors } = useColors();
  return {
    Pending: {
      backgroundColor: colors.warningLight,
      textColor: colors.warning,
    },
    "In Progress": {
      backgroundColor: colors.primaryLight,
      textColor: colors.primary,
    },
    Resolved: {
      backgroundColor: colors.successLight,
      textColor: colors.success,
    },
  };
}
