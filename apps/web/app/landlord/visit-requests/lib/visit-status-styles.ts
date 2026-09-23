import type { LandlordVisitStatus } from "@/service/landlordVisitRequestsService";

export type VisitStatusChipColor = "warning" | "success" | "danger" | "default" | "accent";

export function getVisitStatusLabel(status: LandlordVisitStatus): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "rescheduled":
      return "Rescheduled";
    case "cancelled":
      return "Cancelled";
  }
}

export function getVisitStatusChipColor(status: LandlordVisitStatus): VisitStatusChipColor {
  switch (status) {
    case "pending":
      return "warning";
    case "approved":
      return "success";
    case "rejected":
      return "danger";
    case "rescheduled":
      return "accent";
    case "cancelled":
      return "default";
  }
}
