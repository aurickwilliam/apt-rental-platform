// Pure helpers shared by the admin list pages (Users, Apartments): parse and
// validate URL filter params on the server, map sort keys to table headers,
// and build the list URL on the client. Kept dependency-free so the
// node:test suite can import it directly.

export type SortDirection = "ascending" | "descending";

export interface SortOption<T extends string = string> {
  id: T;
  label: string;
  /** Table column id this sort maps to, when the column header can sort. */
  column?: string;
  direction?: SortDirection;
}

export type JoinedPreset = "any" | "7d" | "30d" | "90d" | "custom";

export const JOINED_PRESETS: readonly JoinedPreset[] = [
  "any",
  "7d",
  "30d",
  "90d",
  "custom",
];

const PRESET_DAYS: Record<"7d" | "30d" | "90d", number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

const DAY_MS = 24 * 60 * 60 * 1000;
// Admin dates are entered and shown in Philippine time (see joinedFormatter).
const MANILA_OFFSET = "+08:00";
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function parseOption<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
  fallback: T,
): T {
  return (allowed as readonly string[]).includes(value ?? "")
    ? (value as T)
    : fallback;
}

export function parseListParam<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
): T[] {
  if (!value) return [];
  return [
    ...new Set(
      value
        .split(",")
        .map((item) => item.trim())
        .filter((item): item is T =>
          (allowed as readonly string[]).includes(item),
        ),
    ),
  ];
}

export function parseIsoDate(value: string | undefined): string | null {
  if (!value || !ISO_DATE_PATTERN.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  // Rejects rollovers such as 2026-02-31.
  return parsed.toISOString().slice(0, 10) === value ? value : null;
}

export function addDaysToIsoDate(value: string, days: number): string {
  const parsed = new Date(`${value}T00:00:00Z`);
  return new Date(parsed.getTime() + days * DAY_MS).toISOString().slice(0, 10);
}

export interface JoinedRange {
  /** Inclusive lower bound (ISO timestamp). */
  from?: string;
  /** Exclusive upper bound (ISO timestamp). */
  before?: string;
}

/**
 * Turns the joined-date filter into timestamp bounds. A custom range is
 * inclusive of both calendar days in Manila time; an incomplete or reversed
 * custom range is ignored (returns null) rather than guessed at.
 */
export function resolveJoinedRange(
  preset: JoinedPreset,
  from: string | null,
  to: string | null,
  now: Date = new Date(),
): JoinedRange | null {
  if (preset === "any") return null;
  if (preset === "custom") {
    if (!from || !to || from > to) return null;
    return {
      from: `${from}T00:00:00${MANILA_OFFSET}`,
      before: `${addDaysToIsoDate(to, 1)}T00:00:00${MANILA_OFFSET}`,
    };
  }
  return {
    from: new Date(now.getTime() - PRESET_DAYS[preset] * DAY_MS).toISOString(),
  };
}

export function sortDescriptorFor<T extends string>(
  options: readonly SortOption<T>[],
  sort: T,
): { column: string; direction: SortDirection } | undefined {
  const option = options.find((item) => item.id === sort);
  return option?.column && option.direction
    ? { column: option.column, direction: option.direction }
    : undefined;
}

export function sortForColumn<T extends string>(
  options: readonly SortOption<T>[],
  column: string,
  direction: SortDirection,
): T | undefined {
  return options.find(
    (item) => item.column === column && item.direction === direction,
  )?.id;
}

/**
 * Builds a list-page URL, dropping empty values and defaults so shared links
 * stay short. Arrays are joined with commas.
 */
export function buildListHref(
  pathname: string,
  params: Record<string, string | string[] | number | null | undefined>,
): string {
  const search = new URLSearchParams();
  for (const [key, raw] of Object.entries(params)) {
    const value = Array.isArray(raw) ? raw.join(",") : raw;
    if (value === null || value === undefined) continue;
    const text = String(value).trim();
    if (text) search.set(key, text);
  }
  const query = search.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function formatResultRange(
  page: number,
  pageSize: number,
  totalCount: number,
  noun: string,
): string {
  if (totalCount === 0) return `No ${noun} found`;
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, totalCount);
  return `Showing ${first}–${last} of ${totalCount} ${noun}`;
}

/** Labels of the selected options, in option order, for filter tags. */
export function formatOptionLabels<T extends string>(
  options: readonly { id: T; label: string }[],
  selected: readonly T[],
): string {
  return options
    .filter((option) => selected.includes(option.id))
    .map((option) => option.label)
    .join(", ");
}
