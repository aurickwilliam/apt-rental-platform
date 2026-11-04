/** Report reasons (keep in sync with the `user_reports.reason` DB check). */
export const USER_REPORT_REASON_LABELS: Record<string, string> = {
  spam: "Spam",
  scam: "Scam or fraud",
  harassment: "Harassment",
  inappropriate: "Inappropriate content",
  fake_profile: "Fake profile or listing",
  other: "Something else",
  fake_listing: "Fake or misleading listing",
  incorrect_info: "Wrong price or details",
  unavailable: "Already rented",
  inappropriate_photos: "Inappropriate photos",
};

export const USER_REPORT_STATUSES = ["open", "resolved", "dismissed"] as const;
export type UserReportStatus = (typeof USER_REPORT_STATUSES)[number];
export type UserReportStatusFilter = UserReportStatus | "all";

export function getReportReasonLabel(reason: string): string {
  return USER_REPORT_REASON_LABELS[reason] ?? "Other";
}

/** Status filter from `?status=`; every report (open and closed) by default. */
export function parseReportStatusFilter(
  value: string | string[] | undefined,
): UserReportStatusFilter {
  const status = Array.isArray(value) ? value[0] : value;
  return (USER_REPORT_STATUSES as readonly string[]).includes(status ?? "")
    ? (status as UserReportStatus)
    : "all";
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

export const USER_REPORT_TARGET_TYPES = ["user", "apartment", "landlord", "tenant"] as const;
export type UserReportTargetTypeFilter = (typeof USER_REPORT_TARGET_TYPES)[number] | "all";

/** Type filter from `?type=`; every kind of report by default. */
export function parseReportTypeFilter(
  value: string | string[] | undefined,
): UserReportTargetTypeFilter {
  const type = Array.isArray(value) ? value[0] : value;
  return (USER_REPORT_TARGET_TYPES as readonly string[]).includes(type ?? "")
    ? (type as UserReportTargetTypeFilter)
    : "all";
}

/** What an admin did about a report (`user_reports.action_taken`). */
export const REPORT_ACTION_LABELS: Record<string, string> = {
  warned: "Warning sent",
  listing_hidden: "Listing hidden",
  user_suspended: "Account suspended",
};

export interface ReportFilters {
  q: string;
  status: UserReportStatusFilter;
  type: UserReportTargetTypeFilter;
}

export const REPORT_SEARCH_MAX_LENGTH = 80;

/** Search text from `?q=`, trimmed, capped and without characters that change a PostgREST filter. */
export function parseReportSearch(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return (raw ?? "").replace(/[%,()*\\]/g, " ").replace(/\s+/g, " ").trim().slice(0, REPORT_SEARCH_MAX_LENGTH);
}

export function parseReportFilters(params: {
  q?: string | string[];
  status?: string | string[];
  type?: string | string[];
}): ReportFilters {
  return {
    q: parseReportSearch(params.q),
    status: parseReportStatusFilter(params.status),
    type: parseReportTypeFilter(params.type),
  };
}

/** URL params for the list; defaults are left out so the plain URL is the default view. */
export function reportFilterParams(filters: ReportFilters, page: number) {
  return {
    q: filters.q || null,
    status: filters.status === "all" ? null : filters.status,
    type: filters.type === "all" ? null : filters.type,
    page: page > 1 ? page : null,
  };
}
