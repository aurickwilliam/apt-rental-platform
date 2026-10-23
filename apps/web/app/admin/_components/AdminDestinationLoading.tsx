import type { ReactNode } from "react";
import Link from "next/link";
import { IconChevronLeft } from "@tabler/icons-react";

interface AdminDestinationLoadingProps {
  title: string;
  backHref?: string;
  backLabel?: string;
  children?: ReactNode;
}

/** Static, non-private chrome; one announcement for all decorative placeholders. */
export default function AdminDestinationLoading({ title, backHref, backLabel, children }: AdminDestinationLoadingProps) {
  return (
    <div className="w-full min-w-0 space-y-4 p-4" role="status" aria-busy="true" aria-label={`Loading ${title}`}>
      {backHref ? (
        <Link href={backHref} className="inline-flex items-center gap-1 rounded-md text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          <IconChevronLeft size={18} aria-hidden="true" />{backLabel ?? "Back"}
        </Link>
      ) : null}
      <h1 className="font-nunito text-3xl font-bold text-primary">{title}</h1>
      <span className="sr-only">Loading {title}…</span>
      <div aria-hidden="true">{children}</div>
    </div>
  );
}
