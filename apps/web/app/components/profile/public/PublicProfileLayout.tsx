import type { ReactNode } from "react";

interface PublicProfileLayoutProps {
  header: ReactNode;
  /** Quick facts (stats, contact): beside the content from xl, right under the header below it. */
  aside: ReactNode;
  /** Listings, reviews, stays. */
  children: ReactNode;
}

// Same two-column split as the own-profile pages (2fr / 1fr from xl). DOM order is
// header, aside, content so the facts come before the long lists on small screens.
export default function PublicProfileLayout({ header, aside, children }: PublicProfileLayoutProps) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
      <div className="min-w-0 xl:col-start-1 xl:row-start-1">{header}</div>
      <div className="flex min-w-0 flex-col gap-3 xl:sticky xl:top-4 xl:col-start-2 xl:row-span-2 xl:row-start-1 xl:self-start">
        {aside}
      </div>
      <div className="flex min-w-0 flex-col gap-5 xl:col-start-1 xl:row-start-2">{children}</div>
    </div>
  );
}
