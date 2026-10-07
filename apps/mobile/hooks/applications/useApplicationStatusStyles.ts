import { useStatusChipStyles } from "@/hooks/useStatusChipStyles";
import { IconClock, IconCircleCheck, IconCircleX, type Icon } from "@tabler/icons-react-native";

export type ApplicationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "closed";

export type ChipColor = "accent" | "default" | "success" | "warning" | "danger";

export function getLandlordApplicationStatusStyle(
  status: "Applied" | "Approved" | "Rejected" | "Cancelled",
  palette: ReturnType<typeof useStatusChipStyles>,
) {
  return {
    Applied: palette.warning,
    Approved: palette.success,
    Rejected: palette.danger,
    Cancelled: palette.danger,
  }[status];
}

export type ApplicationStatusStyle = {
  label: string;
  description: string;
  Icon: Icon;
  chipColor: ChipColor;
  iconColor: string;
};

const FALLBACK_STYLE = (palette: ReturnType<typeof useStatusChipStyles>): ApplicationStatusStyle => ({
  label: "Unknown",
  description: "",
  Icon: IconCircleX,
  chipColor: "default",
  iconColor: palette.neutral.textColor,
});

export function useApplicationStatusStyles() {
  const palette = useStatusChipStyles();

  const STATUS_STYLES: Record<ApplicationStatus, ApplicationStatusStyle> = {
    pending: {
      label: "Pending",
      description:
        "Your application is being reviewed by the landlord. We'll notify you once there's an update.",
      Icon: IconClock,
      chipColor: "warning",
      iconColor: palette.warning.textColor,
    },
    approved: {
      label: "Approved",
      description:
        "Your application has been approved! The landlord will reach out to finalize your lease.",
      Icon: IconCircleCheck,
      chipColor: "success",
      iconColor: palette.success.textColor,
    },
    rejected: {
      label: "Rejected",
      description: "Unfortunately, your application was not approved this time.",
      Icon: IconCircleX,
      chipColor: "danger",
      iconColor: palette.danger.textColor,
    },
    cancelled: {
      label: "Cancelled",
      description:
        "Your application has been cancelled. If you have any questions, please contact the landlord.",
      Icon: IconCircleX,
      chipColor: "danger",
      iconColor: palette.danger.textColor,
    },
    closed: {
      label: "Closed",
      description:
        "This apartment has already been leased to another applicant, so this application is now closed.",
      Icon: IconCircleX,
      chipColor: "default",
      iconColor: palette.neutral.textColor,
    },
  };

  const getStatusStyle = (status: ApplicationStatus): ApplicationStatusStyle =>
    STATUS_STYLES[status] ?? FALLBACK_STYLE(palette);

  return { STATUS_STYLES, getStatusStyle };
}
