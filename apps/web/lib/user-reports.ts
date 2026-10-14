/** Report reasons (keep in sync with the `user_reports.reason` DB check). */
export const USER_REPORT_REASON_LABELS: Record<string, string> = {
  spam: "Spam",
  scam: "Scam or fraud",
  harassment: "Harassment",
  inappropriate: "Inappropriate content",
  fake_profile: "Fake profile or listing",
  other: "Something else",
};

export const USER_REPORT_STATUSES = ["open", "resolved", "dismissed"] as const;
export type UserReportStatus = (typeof USER_REPORT_STATUSES)[number];
export type UserReportStatusFilter = UserReportStatus | "all";

export function getReportReasonLabel(reason: string): string {
  return USER_REPORT_REASON_LABELS[reason] ?? "Other";
}

/** Status filter from `?status=`; open reports by default. */
export function parseReportStatusFilter(
  value: string | string[] | undefined,
): UserReportStatusFilter {
  const status = Array.isArray(value) ? value[0] : value;
  if (status === "all") return "all";
  return (USER_REPORT_STATUSES as readonly string[]).includes(status ?? "")
    ? (status as UserReportStatus)
    : "open";
}

export function formatReportPerson(
  person: { first_name: string | null; last_name: string | null; email: string | null } | null,
): string {
  if (!person) return "Deleted account";
  return (
    `${person.first_name ?? ""} ${person.last_name ?? ""}`.trim() ||
    person.email ||
    "Unnamed user"
  );
}
