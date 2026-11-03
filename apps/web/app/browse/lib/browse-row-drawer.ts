import { BROWSE_DEFAULT_BUDGET_MAX, type BrowseRowSpec } from "@repo/utils";

import { MAX_BUDGET } from "./browse-query";

/**
 * A shared Browse row (`@repo/utils` `BrowseRowSpec`) in the web's terms: the
 * filter drawer's params for what the drawer can say, exact bounds beside them
 * for what it cannot, and the See All query. Row queries and See All use
 * `applyBrowseFilters` with these params, so both lists filter the same way.
 */
export interface DrawerRow {
  params: Record<string, string>;
  /** Drawer filters only take an exact bedroom count, so ranges ride beside `params`. */
  bedroomRange?: { min: number; max: number | null };
  /**
   * Exact monthly-rent bounds. The drawer ignores a price_max of MAX_BUDGET or
   * more (its slider's "and up" end), so a row that must honor one cannot go
   * through `params`.
   */
  priceRange?: { min: number; max: number };
  /** Lowest average rating; the drawer has no rating filter. */
  minRating?: number;
  /** Query string for See All, or null when no drawer filter matches the row. */
  seeAllQuery: string | null;
}

const OPEN_MAX_PRICE = Number.MAX_SAFE_INTEGER;

export function toDrawerRow(spec: BrowseRowSpec): DrawerRow {
  const c = spec.criteria;

  // Params the row query and See All both read.
  const params: Record<string, string> = {};
  if (c.cities && c.cities.length > 0) params.locations = c.cities.join(",");
  if (c.verified) params.verified = "1";
  if (c.types && c.types.length > 0) params.apt_types = c.types.join(",");
  if (c.sizeMin !== undefined) params.size_min = String(c.sizeMin);
  if (c.furnishing) params.furnishing = c.furnishing;
  if (c.amenities && c.amenities.length > 0) params.amenities = c.amenities.join(",");

  // Params only See All reads: the row query applies the exact bounds below.
  const seeAllOnly: Record<string, string> = {};
  let drawerCanExpress = true;
  const row: DrawerRow = { params, seeAllQuery: null };

  if (c.priceMin !== undefined || c.priceMax !== undefined) {
    row.priceRange = { min: c.priceMin ?? 0, max: c.priceMax ?? OPEN_MAX_PRICE };
    // Between the drawer's cap and the top of the saved range the drawer would
    // drop the max, so no See All matches the row.
    if (c.priceMax !== undefined && c.priceMax >= MAX_BUDGET && c.priceMax < BROWSE_DEFAULT_BUDGET_MAX) {
      drawerCanExpress = false;
    }
    if (c.priceMin !== undefined) seeAllOnly.price_min = String(c.priceMin);
    if (c.priceMax !== undefined) seeAllOnly.price_max = String(c.priceMax);
  }

  if (c.bedroomMin !== undefined) {
    row.bedroomRange = { min: c.bedroomMin, max: c.bedroomMax ?? null };
    // Only "4+" has an exact twin in the drawer.
    if (c.bedroomMax === undefined && c.bedroomMin === 4) seeAllOnly.bedrooms = "4+";
    else drawerCanExpress = false;
  }

  if (c.minRating !== undefined) {
    row.minRating = c.minRating;
    drawerCanExpress = false;
  }

  const seeAll = { ...params, ...seeAllOnly };
  row.seeAllQuery =
    drawerCanExpress && Object.keys(seeAll).length > 0 ? new URLSearchParams(seeAll).toString() : null;
  return row;
}
