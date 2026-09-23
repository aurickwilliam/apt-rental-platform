import type { DisplayStatus } from "@/hooks/use-landlord-applications";

export type { DisplayStatus };

export function statusChipColor(s: DisplayStatus): "warning" | "success" | "danger" | "default" {
  switch (s) {
    case "Applied":
      return "warning";
    case "Approved":
      return "success";
    case "Rejected":
      return "danger";
    case "Cancelled":
      return "default";
  }
}
