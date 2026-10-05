import { useStatusChipStyles, type StatusChipStyle } from "@/hooks/useStatusChipStyles";

export type VisitRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "rescheduled";

export type StatusStyle = StatusChipStyle & { label: string };

const FALLBACK_STYLE = (status: ReturnType<typeof useStatusChipStyles>): StatusStyle => ({
  label: "Unknown",
  ...status.neutral,
});

export function useVisitRequestStatusStyles() {
  const palette = useStatusChipStyles();

  const STATUS_STYLES: Record<VisitRequestStatus, StatusStyle> = {
    pending: {
      label: "Pending",
      ...palette.warning,
    },
    approved: {
      label: "Approved",
      ...palette.success,
    },
    rejected: {
      label: "Rejected",
      ...palette.danger,
    },
    rescheduled: {
      label: "Rescheduled",
      ...palette.warning,
    },
    cancelled: {
      label: "Cancelled",
      ...palette.danger,
    },
  };

  const getStatusStyle = (status: VisitRequestStatus): StatusStyle =>
    STATUS_STYLES[status] ?? FALLBACK_STYLE(palette);

  return { STATUS_STYLES, getStatusStyle };
}
