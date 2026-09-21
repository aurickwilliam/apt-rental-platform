import { useColors } from "@/hooks/useTheme";
import { IconClock, IconCircleCheck, IconCircleX, type Icon } from "@tabler/icons-react-native";

export type ApplicationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "closed";

export type ChipColor = "accent" | "default" | "success" | "warning" | "danger";

export type ApplicationStatusStyle = {
  label: string;
  description: string;
  Icon: Icon;
  chipColor: ChipColor;
  iconColor: string;
};

const FALLBACK_STYLE = (colors: ReturnType<typeof useColors>["colors"]): ApplicationStatusStyle => ({
  label: "Unknown",
  description: "",
  Icon: IconCircleX,
  chipColor: "default",
  iconColor: colors.gray500,
});

export function useApplicationStatusStyles() {
  const { colors } = useColors();

  const STATUS_STYLES: Record<ApplicationStatus, ApplicationStatusStyle> = {
    pending: {
      label: "Pending",
      description:
        "Your application is being reviewed by the landlord. We'll notify you once there's an update.",
      Icon: IconClock,
      chipColor: "warning",
      iconColor: colors.warning,
    },
    approved: {
      label: "Approved",
      description:
        "Your application has been approved! The landlord will reach out to finalize your lease.",
      Icon: IconCircleCheck,
      chipColor: "success",
      iconColor: colors.success,
    },
    rejected: {
      label: "Rejected",
      description: "Unfortunately, your application was not approved this time.",
      Icon: IconCircleX,
      chipColor: "danger",
      iconColor: colors.danger,
    },
    cancelled: {
      label: "Cancelled",
      description:
        "Your application has been cancelled. If you have any questions, please contact the landlord.",
      Icon: IconCircleX,
      chipColor: "default",
      iconColor: colors.gray400,
    },
    closed: {
      label: "Closed",
      description:
        "This apartment has already been leased to another applicant, so this application is now closed.",
      Icon: IconCircleX,
      chipColor: "default",
      iconColor: colors.gray400,
    },
  };

  const getStatusStyle = (status: ApplicationStatus): ApplicationStatusStyle =>
    STATUS_STYLES[status] ?? FALLBACK_STYLE(colors);

  return { STATUS_STYLES, getStatusStyle };
}
