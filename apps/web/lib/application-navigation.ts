import type { ApplicationStatus } from "@/app/tenant/applications/lib/statusStyles";

export const APPLICATION_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "cancelled",
  "closed",
] as const satisfies readonly ApplicationStatus[];

export type ApplicationSort = "pending_first" | "newest" | "oldest";

export const APPLICATION_SORTS: readonly ApplicationSort[] = ["pending_first", "newest", "oldest"];
export const DEFAULT_APPLICATION_SORT: ApplicationSort = "pending_first";
export const APPLICATIONS_PATH = "/tenant/my-rental";
export const APPLICATION_STATUS_PARAM = "applicationStatus";
export const APPLICATION_SORT_PARAM = "applicationSort";
export const APPLICATION_RETURN_PARAM = "from";
export const APPLICATION_RETURN_TTL_MS = 30 * 60 * 1000;

const APPLICATION_RETURN_KEY = "apt-application-return:v1";

export interface ApplicationListFilters {
  statuses: ApplicationStatus[];
  sort: ApplicationSort;
}

export const DEFAULT_APPLICATION_FILTERS: ApplicationListFilters = {
  statuses: [],
  sort: DEFAULT_APPLICATION_SORT,
};

interface ReturnStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface ApplicationReturnMarker {
  applicationId: string;
  href: string;
  at: number;
  scrollY: number;
}

export type ApplicationBackTarget = { kind: "history" } | { kind: "href"; href: string };

interface StorageOptions {
  storage?: ReturnStorage;
}

interface RememberReturnOptions extends StorageOptions {
  now?: number;
  scrollY?: number;
}

function isApplicationStatus(value: string): value is ApplicationStatus {
  return (APPLICATION_STATUSES as readonly string[]).includes(value);
}

function searchParamsFrom(search?: string | URLSearchParams | null): URLSearchParams {
  if (typeof search !== "string") return search ?? new URLSearchParams();
  const withoutHash = search.split("#", 1)[0];
  const queryIndex = withoutHash.indexOf("?");
  if (queryIndex >= 0) return new URLSearchParams(withoutHash.slice(queryIndex + 1));
  // A bare path has no query params; a bare query string ("a=1") does.
  return new URLSearchParams(withoutHash.startsWith("/") ? "" : withoutHash);
}

/** Keeps only real APT statuses, de-duplicated and in the app's canonical order. */
export function parseApplicationStatuses(value: string | null | undefined): ApplicationStatus[] {
  const selected = new Set(
    (value ?? "")
      .split(",")
      .map((part) => part.trim().toLowerCase())
      .filter(isApplicationStatus),
  );
  return APPLICATION_STATUSES.filter((status) => selected.has(status));
}

export function parseApplicationSort(value: string | null | undefined): ApplicationSort {
  return APPLICATION_SORTS.find((sort) => sort === value) ?? DEFAULT_APPLICATION_SORT;
}

export function parseApplicationListFilters(
  search?: string | URLSearchParams | null,
): ApplicationListFilters {
  const params = searchParamsFrom(search);
  return {
    statuses: parseApplicationStatuses(params.get(APPLICATION_STATUS_PARAM)),
    sort: parseApplicationSort(params.get(APPLICATION_SORT_PARAM)),
  };
}

/**
 * Filter/sort live in the URL so browser Back restores them. Passing the current
 * search keeps unrelated params (for example the notifications drawer) intact;
 * the navigation return target itself stays canonical.
 */
export function applicationListHref(
  filters: ApplicationListFilters,
  currentSearch?: string | URLSearchParams | null,
): string {
  const params =
    currentSearch == null ? new URLSearchParams() : new URLSearchParams(searchParamsFrom(currentSearch));
  params.delete(APPLICATION_STATUS_PARAM);
  params.delete(APPLICATION_SORT_PARAM);
  if (filters.statuses.length > 0) {
    params.set(APPLICATION_STATUS_PARAM, filters.statuses.join(","));
  }
  if (filters.sort !== DEFAULT_APPLICATION_SORT) {
    params.set(APPLICATION_SORT_PARAM, filters.sort);
  }
  const query = params.toString();
  return query ? `${APPLICATIONS_PATH}?${query}` : APPLICATIONS_PATH;
}

/**
 * Only My Rental on the same origin is a valid return destination. Everything
 * else falls back to the tenant dashboard, so a hand-edited link cannot become
 * an open redirect.
 */
export function safeApplicationReturnPath(value: string | null | undefined): string {
  if (!value || value.length > 2048 || !value.startsWith("/") || value.startsWith("//")) {
    return APPLICATIONS_PATH;
  }
  if (/[\s\\\u0000-\u001f\u007f]/.test(value)) return APPLICATIONS_PATH;

  let url: URL;
  try {
    url = new URL(value, "https://apt.invalid");
  } catch {
    return APPLICATIONS_PATH;
  }
  if (url.origin !== "https://apt.invalid" || url.pathname !== APPLICATIONS_PATH) {
    return APPLICATIONS_PATH;
  }
  return applicationListHref(parseApplicationListFilters(url.search));
}

export function applicationDetailHref({
  applicationId,
  apartmentId,
  returnHref,
}: {
  applicationId: string;
  apartmentId: string;
  returnHref?: string | null;
}): string {
  const params = new URLSearchParams();
  if (apartmentId) params.set("apartmentId", apartmentId);
  params.set(APPLICATION_RETURN_PARAM, safeApplicationReturnPath(returnHref));
  return `/tenant/applications/${encodeURIComponent(applicationId)}?${params.toString()}`;
}

function resolveStorage(storage?: ReturnStorage): ReturnStorage | null {
  if (storage) return storage;
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/** Records the list URL and scroll position for the application being opened. */
export function rememberApplicationReturn(
  applicationId: string,
  returnHref: string,
  options: RememberReturnOptions = {},
): void {
  const storage = resolveStorage(options.storage);
  if (!storage || !applicationId) return;

  const scrollY =
    options.scrollY ?? (typeof window === "undefined" ? 0 : (window.scrollY ?? 0));
  const marker: ApplicationReturnMarker = {
    applicationId,
    href: safeApplicationReturnPath(returnHref),
    at: options.now ?? Date.now(),
    scrollY: Number.isFinite(scrollY) ? Math.max(0, Math.round(scrollY)) : 0,
  };
  try {
    storage.setItem(APPLICATION_RETURN_KEY, JSON.stringify(marker));
  } catch {
    // Navigation memory is best effort; storage may be full or blocked.
  }
}

export function readApplicationReturn(options: StorageOptions = {}): ApplicationReturnMarker | null {
  const storage = resolveStorage(options.storage);
  if (!storage) return null;
  try {
    const value = storage.getItem(APPLICATION_RETURN_KEY);
    if (!value) return null;
    const parsed = JSON.parse(value) as Partial<ApplicationReturnMarker> | null;
    if (
      !parsed ||
      typeof parsed.applicationId !== "string" ||
      !parsed.applicationId ||
      typeof parsed.href !== "string" ||
      typeof parsed.at !== "number" ||
      !Number.isFinite(parsed.at) ||
      typeof parsed.scrollY !== "number" ||
      !Number.isFinite(parsed.scrollY)
    ) {
      return null;
    }
    return {
      applicationId: parsed.applicationId,
      href: safeApplicationReturnPath(parsed.href),
      at: parsed.at,
      scrollY: Math.max(0, Math.round(parsed.scrollY)),
    };
  } catch {
    return null;
  }
}

export function clearApplicationReturn(options: StorageOptions = {}): void {
  const storage = resolveStorage(options.storage);
  if (!storage) return;
  try {
    storage.removeItem(APPLICATION_RETURN_KEY);
  } catch {
    // Ignore unavailable storage.
  }
}

/**
 * `history` only when this tab opened the detail page from the list moments
 * ago; otherwise push a validated internal destination. That keeps browser
 * Back/Forward intact without trusting the URL for the history choice.
 */
export function applicationBackTarget({
  applicationId,
  from,
  marker,
  now = Date.now(),
  canGoBack = true,
}: {
  applicationId: string;
  from?: string | null;
  marker?: ApplicationReturnMarker | null;
  now?: number;
  /** False in a fresh tab that has no earlier entry of its own. */
  canGoBack?: boolean;
}): ApplicationBackTarget {
  const href = safeApplicationReturnPath(from ?? marker?.href ?? null);
  // An explicit `from` must also match the marker, so a leftover marker from
  // an older visit cannot make Back follow unrelated browser history.
  const expectedHref = from == null ? null : safeApplicationReturnPath(from);
  if (
    canGoBack &&
    marker &&
    marker.applicationId === applicationId &&
    Math.abs(now - marker.at) <= APPLICATION_RETURN_TTL_MS &&
    (expectedHref == null || marker.href === expectedHref)
  ) {
    return { kind: "history" };
  }
  return { kind: "href", href };
}

/**
 * One-shot scroll restoration for the list that the detail page was opened
 * from. A marker for another filtered view, or a stale one, is ignored.
 */
export function takeApplicationReturnScroll(
  href: string,
  options: StorageOptions & { now?: number } = {},
): number | null {
  const marker = readApplicationReturn({ storage: options.storage });
  if (!marker) return null;

  if (Math.abs((options.now ?? Date.now()) - marker.at) > APPLICATION_RETURN_TTL_MS) {
    clearApplicationReturn({ storage: options.storage });
    return null;
  }
  if (marker.href !== safeApplicationReturnPath(href)) return null;

  clearApplicationReturn({ storage: options.storage });
  return marker.scrollY;
}

interface ListableApplication {
  status: ApplicationStatus;
  created_at: string;
}

function applicationDate(createdAt: string): number {
  const timestamp = new Date(createdAt).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

/** Client-side filtering/sorting over the already-loaded caller-owned list. */
export function filterApplicationList<T extends ListableApplication>(
  applications: readonly T[],
  filters: ApplicationListFilters,
): T[] {
  const filtered =
    filters.statuses.length > 0
      ? applications.filter((application) => filters.statuses.includes(application.status))
      : [...applications];

  return filtered.sort((first, second) => {
    if (filters.sort === "pending_first") {
      const pendingDifference =
        Number(second.status === "pending") - Number(first.status === "pending");
      if (pendingDifference !== 0) return pendingDifference;
    }

    const dateDifference = applicationDate(second.created_at) - applicationDate(first.created_at);
    return filters.sort === "oldest" ? -dateDifference : dateDifference;
  });
}
