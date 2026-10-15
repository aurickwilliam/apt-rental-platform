import type { UserReportStatus } from "@/lib/user-reports";

export interface ReportPerson {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

export interface AdminUserReport {
  id: string;
  reason: string;
  details: string | null;
  status: UserReportStatus;
  resolution_note: string | null;
  created_at: string;
  resolved_at: string | null;
  reporter: ReportPerson | null;
  reported: (ReportPerson & { is_suspended: boolean }) | null;
  apartment: { id: string; name: string } | null;
}

export const reportDateFormatter = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function reportStatusColor(status: UserReportStatus): "warning" | "success" | "default" {
  if (status === "open") return "warning";
  if (status === "resolved") return "success";
  return "default";
}
