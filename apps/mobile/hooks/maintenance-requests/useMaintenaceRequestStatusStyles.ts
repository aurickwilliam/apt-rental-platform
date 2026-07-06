import type { MaintenanceRequestStatus, MaintenanceRequestUrgency } from "./useMaintenanceRequests";
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
    Cancelled: {
      backgroundColor: colors.gray100,
      textColor: colors.gray500
    },
  };
}

export function useMaintenanceRequestUrgencyStyles(): Record<
  MaintenanceRequestUrgency,
  StatusStyle
> {
  const { colors } = useColors();
  return {
    high: {
      backgroundColor: colors.dangerLight,
      textColor: colors.danger,
    },
    medium: {
      backgroundColor: colors.warningLight,
      textColor: colors.warning,
    },
    low: {
      backgroundColor: colors.gray100,
      textColor: colors.gray500,
    },
  };
}
