// Default browse = no search text, no filters, first page. Mirrors the mobile
// search tab, which only shows curated sections in this state. Pure and
// client-safe: the loading skeleton uses it to pick the layout that matches
// the page the user is about to see.
const DISCOVERY_PARAM_KEYS = [
  "search",
  "locations",
  "price_min",
  "price_max",
  "apt_types",
  "bedrooms",
  "bathrooms",
  "size_min",
  "size_max",
  "furnishing",
  "floor_level",
  "lease",
  "amenities",
  "sort",
  "verified",
] as const;

// Params the filter drawer owns (the active-filter badge and the results bar's
// Clear count these; text search is separate).
export const FILTER_KEYS = [
  "locations",
  "price_min",
  "price_max",
  "apt_types",
  "bedrooms",
  "bathrooms",
  "size_min",
  "size_max",
  "furnishing",
  "floor_level",
  "lease",
  "amenities",
  "sort",
  "verified",
] as const;

export function isDefaultBrowseParams(params: Record<string, string>): boolean {
  if (params.page && params.page !== "1") return false;
  return !DISCOVERY_PARAM_KEYS.some((key) => {
    const value = params[key];
    return value != null && value !== "";
  });
}
