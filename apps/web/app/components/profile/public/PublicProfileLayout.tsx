import type { ReactNode } from "react";

interface PublicProfileLayoutProps {
  header: ReactNode;
  /** Quick facts (stats, contact): beside the content from xl, right under the header below it. */
  aside: ReactNode;
  /** Listings, reviews, stays. */
  children: ReactNode;
  /** The page sits under the sticky public navbar, so the sticky aside must start below it. */
  hasTopNavbar?: boolean;
}

// Sticky offsets from the top of the viewport at xl. The public navbar is `min-h-20` (5rem) plus its
// border, so its pages clear it with 1rem of gap; sidebar shells have no top bar. The max heights keep a
// tall aside scrollable on short screens instead of running past the viewport.
const ASIDE_STICKY_BELOW_NAVBAR = "xl:top-24 xl:max-h-[calc(100dvh-7rem)]";
const ASIDE_STICKY_AT_TOP = "xl:top-4 xl:max-h-[calc(100dvh-2rem)]";

// Same two-column split as the own-profile pages (2fr / 1fr from xl). DOM order is
// header, aside, content so the facts come before the long lists on small screens.
export default function PublicProfileLayout({ header, aside, children, hasTopNavbar = false }: PublicProfileLayoutProps) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
      <div className="min-w-0 xl:col-start-1 xl:row-start-1">{header}</div>
      <div
        className={`flex min-w-0 flex-col gap-3 xl:sticky xl:col-start-2 xl:row-span-2 xl:row-start-1 xl:self-start xl:overflow-y-auto ${
          hasTopNavbar ? ASIDE_STICKY_BELOW_NAVBAR : ASIDE_STICKY_AT_TOP
        }`}
      >
        {aside}
      </div>
      <div className="flex min-w-0 flex-col gap-5 xl:col-start-1 xl:row-start-2">{children}</div>
    </div>
  );
}
