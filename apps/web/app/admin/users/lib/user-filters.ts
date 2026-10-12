import {
  JOINED_PRESETS,
  parseIsoDate,
  parseListParam,
  parseOption,
  type JoinedPreset,
  type SortOption,
} from "@/lib/admin-filters";
import type { FilterOption } from "../../_components/filters/types";

export const USER_ROLES = ["tenant", "landlord", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const VERIFICATION_STATUSES = [
  "pending",
  "unverified",
  "verified",
  "rejected",
] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const ACCESS_FILTERS = ["all", "active", "suspended"] as const;
export type AccessFilter = (typeof ACCESS_FILTERS)[number];

export const USER_SORT_KEYS = [
  "newest",
  "oldest",
  "name_asc",
  "name_desc",
  "updated",
] as const;
export type UserSort = (typeof USER_SORT_KEYS)[number];

export const ROLE_OPTIONS: readonly FilterOption<UserRole>[] = [
  { id: "tenant", label: "Tenant" },
  { id: "landlord", label: "Landlord" },
  { id: "admin", label: "Administrator" },
];

export const VERIFICATION_OPTIONS: readonly FilterOption<VerificationStatus>[] =
  [
    { id: "pending", label: "Pending" },
    { id: "unverified", label: "Unverified" },
    { id: "verified", label: "Verified" },
    { id: "rejected", label: "Rejected" },
  ];

export const ACCESS_OPTIONS: readonly FilterOption<AccessFilter>[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "suspended", label: "Suspended" },
];

// `column` ids match the sortable headers in UsersTable.
export const USER_SORT_OPTIONS: readonly SortOption<UserSort>[] = [
  { id: "newest", label: "Newest joined", column: "joined", direction: "descending" },
  { id: "oldest", label: "Oldest joined", column: "joined", direction: "ascending" },
  { id: "name_asc", label: "Name A–Z", column: "user", direction: "ascending" },
  { id: "name_desc", label: "Name Z–A", column: "user", direction: "descending" },
  { id: "updated", label: "Recently updated" },
];

export interface UserFilters {
  q: string;
  roles: UserRole[];
  verifications: VerificationStatus[];
  access: AccessFilter;
  joined: JoinedPreset;
  from: string | null;
  to: string | null;
  sort: UserSort;
}

export interface UserSearchParams {
  q?: string;
  role?: string;
  verification?: string;
  access?: string;
  joined?: string;
  from?: string;
  to?: string;
  sort?: string;
  page?: string;
}

export function parseUserFilters(params: UserSearchParams): UserFilters {
  const from = parseIsoDate(params.from);
  const to = parseIsoDate(params.to);
  let joined = parseOption(params.joined, JOINED_PRESETS, "any");
  // A custom range without both valid dates filters nothing; show it as such.
  if (joined === "custom" && (!from || !to || from > to)) joined = "any";
  const isCustom = joined === "custom";
  return {
    q: params.q?.trim() ?? "",
    roles: parseListParam(params.role, USER_ROLES),
    verifications: parseListParam(params.verification, VERIFICATION_STATUSES),
    access: parseOption(params.access, ACCESS_FILTERS, "all"),
    joined,
    from: isCustom ? from : null,
    to: isCustom ? to : null,
    sort: parseOption(params.sort, USER_SORT_KEYS, "newest"),
  };
}

/** URL params for a filter state; defaults are omitted to keep links short. */
export function userFilterParams(filters: UserFilters, page: number) {
  return {
    q: filters.q,
    role: filters.roles,
    verification: filters.verifications,
    access: filters.access === "all" ? null : filters.access,
    joined: filters.joined === "any" ? null : filters.joined,
    from: filters.from,
    to: filters.to,
    sort: filters.sort === "newest" ? null : filters.sort,
    page: page > 1 ? page : null,
  };
}
