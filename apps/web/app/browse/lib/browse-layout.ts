// Frame classes shared by the loaded Browse page and its loading skeletons, so
// the placeholder occupies exactly the space the real content will (no jump
// when the page streams in). Plain strings: safe to import from server and
// client components alike.

// Page frame. The tenant shell is a flex item beside the sidebar and fills the
// width; the public route is capped and centered.
export function browseFrameClass(fullWidth: boolean): string {
  return `px-4 sm:px-6 py-4 overflow-x-clip ${fullWidth ? "w-full" : "max-w-7xl mx-auto"}`;
}

// Primary-colored search hero. Below md the banner copy is hidden and only the
// search pill remains.
export const BROWSE_HERO_CLASS =
  "w-full min-w-0 md:min-h-52 bg-primary rounded-xl flex items-stretch justify-center flex-col gap-2 sm:gap-3 px-3 md:px-4 py-3 md:py-10 md:text-center";

// Search pill (+ mobile filter entry) row inside the hero.
export const BROWSE_SEARCH_ROW_CLASS =
  "flex flex-row items-center gap-2 w-full max-w-xl mt-2 mx-auto min-w-0";

// Results area under the hero: optional filter rail beside the content.
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
