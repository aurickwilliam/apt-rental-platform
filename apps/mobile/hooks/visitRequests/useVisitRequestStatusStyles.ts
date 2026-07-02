import { useColors } from "@/hooks/useTheme";

export type VisitRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "rescheduled";

export type StatusStyle = {
  label: string;
  backgroundColor: string;
  textColor: string;
};

const FALLBACK_STYLE = (colors: ReturnType<typeof useColors>["colors"]): StatusStyle => ({
  label: "Unknown",
  backgroundColor: colors.gray100,
  textColor: colors.gray500,
});

export function useVisitRequestStatusStyles() {
  const { colors } = useColors();

  const STATUS_STYLES: Record<VisitRequestStatus, StatusStyle> = {
    pending: {
      label: "Pending",
      backgroundColor: colors.warningLight,
      textColor: colors.warning,
    },
    approved: {
      label: "Approved",
      backgroundColor: colors.successLight,
      textColor: colors.success,
    },
    rejected: {
      label: "Rejected",
      backgroundColor: colors.dangerLight,
      textColor: colors.danger,
    },
    rescheduled: {
      label: "Rescheduled",
      backgroundColor: colors.primaryLight,
      textColor: colors.primary,
    },
    cancelled: {
      label: "Cancelled",
      backgroundColor: colors.gray100,
      textColor: colors.gray500,
    },
  };

  const getStatusStyle = (status: VisitRequestStatus): StatusStyle =>
    STATUS_STYLES[status] ?? FALLBACK_STYLE(colors);

  return { STATUS_STYLES, getStatusStyle };
}
