import { Clock, CheckCircle, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type ApplicationStatus = "pending" | "approved" | "rejected" | "cancelled" | "closed";

export type StatusStyle = {
  label: string;
  description: string;
  Icon: LucideIcon;
  chipColor: "warning" | "success" | "danger" | "default";
  iconColor: string;
};

export function getApplicationStatusStyle(status: ApplicationStatus): StatusStyle {
  switch (status) {
    case "pending":
      return {
        label: "Pending",
        description: "Your application is being reviewed by the landlord. We'll notify you once there's an update.",
        Icon: Clock,
        chipColor: "warning",
        iconColor: "#FACC15",
      };
    case "approved":
      return {
        label: "Approved",
        description: "Your application has been approved! The landlord will reach out to finalize your lease.",
        Icon: CheckCircle,
        chipColor: "success",
        iconColor: "#22C55E",
      };
    case "rejected":
      return {
        label: "Rejected",
        description: "Unfortunately, your application was not approved this time.",
        Icon: XCircle,
        chipColor: "danger",
        iconColor: "#E50914",
      };
    case "cancelled":
      return {
        label: "Cancelled",
        description: "Your application has been cancelled.",
        Icon: XCircle,
        chipColor: "default",
        iconColor: "#9CA3AF",
      };
    case "closed":
      return {
        label: "Closed",
        description: "This apartment has already been leased to another applicant, so this application is now closed.",
        Icon: XCircle,
        chipColor: "default",
        iconColor: "#9CA3AF",
      };
    default:
      return {
        label: "Unknown",
        description: "",
        Icon: XCircle,
        chipColor: "default",
        iconColor: "#9CA3AF",
      };
  }
}
