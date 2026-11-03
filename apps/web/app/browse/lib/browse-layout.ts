// Frame classes shared by the loaded Browse page and its loading skeletons, so
// the placeholder occupies exactly the space the real content will (no jump
// when the page streams in). Plain strings: safe to import from server and
// client components alike.

// Page frame. The tenant shell is a flex item beside the sidebar and fills the
// width; the public route is capped and centered.
export function browseFrameClass(fullWidth: boolean): string {
  return `px-4 sm:px-6 py-4 overflow-x-clip ${fullWidth ? "w-full" : "max-w-7xl mx-auto"}`;
}

// Search header: a short heading, one search bar that holds the filter, map and
// Ava entries, and the city chips. No banner. Below md the heading is hidden and
// the bar leads (mirrors the mobile app, which opens straight into search).
export const BROWSE_HEADER_CLASS = "flex w-full min-w-0 flex-col gap-3";

// The bar is one pill: border and focus ring live here, so the input inside it
// is borderless. Fixed height so the loading placeholder matches exactly.
export const BROWSE_SEARCH_BAR_CLASS =
  "relative flex h-12 w-full min-w-0 items-center gap-1 rounded-full border border-gray-300 bg-surface pl-1 pr-1.5 transition-all focus-within:border-[#376BF5] focus-within:ring-2 focus-within:ring-[#376BF5]/15";

// One line of city chips; it scrolls sideways on narrow screens instead of wrapping.
export const BROWSE_CITY_CHIPS_CLASS =
  "flex min-w-0 items-center gap-2 overflow-x-auto py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

// Results area under the header: optional filter rail beside the content.
export const BROWSE_BODY_CLASS = "mt-4 flex flex-col md:flex-row gap-4";

// Apartment results grid, shared by the loaded grid and its skeleton so the
// columns match. Denser than the old 4-column cap: the cards are tall (square
// photo), so wide screens get 5 and 6 columns instead of ever-larger cards.
export const BROWSE_GRID_CLASS =
  "grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6";

// Card grid inside the map search's list column (half the width on desktop).
export const MAP_LIST_GRID_CLASS =
  "grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-2 2xl:grid-cols-3";

// Map search layout (desktop). The page scrolls as a whole (so the browser's
// own scrollbar moves the list); the search bar sticks to the top and the map
// sticks under it, filling the rest of the viewport. The bar is 4.75rem tall
// (1rem padding around the 2.75rem row); the public route's h-16 navbar sits
// above both.
export interface MapSearchLayout {
  /** Sticky offset of the search bar. */
  barTop: string;
  /** Sticky offset and height of the map column. */
  mapSticky: string;
}

export const MAP_LAYOUT_PUBLIC: MapSearchLayout = {
  barTop: "lg:top-16",
  mapSticky: "lg:top-[8.75rem] lg:h-[calc(100dvh-9.75rem)]",
};

export const MAP_LAYOUT_TENANT: MapSearchLayout = {
  barTop: "lg:top-0",
  mapSticky: "lg:top-[4.75rem] lg:h-[calc(100dvh-5.75rem)]",
};
