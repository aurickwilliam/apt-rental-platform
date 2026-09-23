export type LandlordMaintenanceStatus =
  | "Pending"
  | "In Progress"
  | "Resolved"
  | "Cancelled";

export type LandlordMaintenanceUrgency = "low" | "medium" | "high";

export function maintenanceStatusChipColor(
  status: LandlordMaintenanceStatus,
): "warning" | "accent" | "success" | "default" {
  if (status === "Pending") return "warning";
  if (status === "In Progress") return "accent";
  if (status === "Resolved") return "success";
  return "default";
}

export const MAINTENANCE_URGENCY_STYLE: Record<
  LandlordMaintenanceUrgency,
  { bg: string; text: string; label: string }
> = {
  low: { bg: "#E5E7EB", text: "#6C757D", label: "Low" },
  medium: { bg: "#FFF8E1", text: "#FACC15", label: "Medium" },
  high: { bg: "#FDA4AF", text: "#E50914", label: "High" },
};
