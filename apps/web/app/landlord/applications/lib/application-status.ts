import type { StatusTone } from "@/lib/status-tone";
import type { DisplayStatus } from "@/hooks/use-landlord-applications";

export type { DisplayStatus };

export function statusChipColor(s: DisplayStatus): StatusTone {
  switch (s) {
    case "Applied":
      return "warning";
    case "Approved":
      return "success";
    case "Rejected":
      return "danger";
    case "Cancelled":
      return "danger";
  }
}
