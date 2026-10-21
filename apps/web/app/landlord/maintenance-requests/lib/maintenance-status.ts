import type { StatusTone } from "@/lib/status-tone";

export type LandlordMaintenanceStatus =
  | "Pending"
  | "In Progress"
  | "Resolved"
  | "Cancelled";

export type LandlordMaintenanceUrgency = "low" | "medium" | "high";

export function maintenanceStatusChipColor(status: LandlordMaintenanceStatus): StatusTone {
  if (status === "Pending" || status === "In Progress") return "warning";
  if (status === "Resolved") return "success";
  return "danger";
}

// A pending fee rides on the next rent; paid and waived fees are settled.
export function maintenanceFeeChip(
  feeStatus: string | null | undefined,
): { tone: StatusTone; label: string } {
  if (feeStatus === "paid") return { tone: "success", label: "Paid" };
  if (feeStatus === "waived") return { tone: "neutral", label: "Waived" };
  return { tone: "warning", label: "Added to next rent" };
}

// Same tones as mobile's useMaintenanceRequestUrgencyStyles.
export const MAINTENANCE_URGENCY_STYLE: Record<
  LandlordMaintenanceUrgency,
  { tone: StatusTone; label: string }
> = {
  low: { tone: "neutral", label: "Low" },
  medium: { tone: "warning", label: "Medium" },
  high: { tone: "danger", label: "High" },
};
