import type { StatusTone } from "@/lib/status-tone";
import { IconClock as Clock, IconCircleCheck as CheckCircle, IconCircleX as XCircle } from "@tabler/icons-react";
import type { Icon as LucideIcon } from "@tabler/icons-react";

export type ApplicationStatus = "pending" | "approved" | "rejected" | "cancelled" | "closed";

export type StatusStyle = {
  label: string;
  /** Short, factual context for cards and page headers. */
  summary: string;
  /** Longer explanation for the Application Status accordion. */
  description: string;
  Icon: LucideIcon;
  chipColor: StatusTone;
};

export function getApplicationStatusStyle(status: ApplicationStatus): StatusStyle {
  switch (status) {
    case "pending":
      return {
        label: "Pending",
        summary: "Awaiting landlord review",
        description: "Your application is being reviewed by the landlord. We'll notify you once there's an update.",
        Icon: Clock,
        chipColor: "warning",
      };
    case "approved":
      return {
        label: "Approved",
        summary: "Approved by the landlord",
        description: "Your application has been approved! The landlord will reach out to finalize your lease.",
        Icon: CheckCircle,
        chipColor: "success",
      };
    case "rejected":
      return {
        label: "Rejected",
        summary: "Not approved this time",
        description: "Unfortunately, your application was not approved this time.",
        Icon: XCircle,
        chipColor: "danger",
      };
    case "cancelled":
      return {
        label: "Cancelled",
        summary: "You cancelled this application",
        description: "Your application has been cancelled.",
        Icon: XCircle,
        chipColor: "danger",
      };
    case "closed":
      return {
        label: "Closed",
        summary: "Apartment leased to another applicant",
        description: "This apartment has already been leased to another applicant, so this application is now closed.",
        Icon: XCircle,
        chipColor: "neutral",
      };
    default:
      return {
        label: "Unknown",
        summary: "",
        description: "",
        Icon: XCircle,
        chipColor: "neutral",
      };
  }
}
