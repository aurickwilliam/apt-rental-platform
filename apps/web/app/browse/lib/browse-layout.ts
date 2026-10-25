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
