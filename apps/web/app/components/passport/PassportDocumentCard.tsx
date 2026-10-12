import Link from "next/link";
import { IconChevronRight } from "@tabler/icons-react";

import { formatDate } from "@repo/utils";
import type { PassportDocumentStatus } from "@repo/passport";

import PassportDocumentThumbnail from "./PassportDocumentThumbnail";
import PassportStatusChip from "./PassportStatusChip";

export type PassportDocumentLayout = "grid" | "list";

interface PassportDocumentCardProps {
  href: string;
  label: string;
  storagePath: string;
  signedUrl: string | null;
  mimeType: string | null;
  status: PassportDocumentStatus;
  createdAt: string;
  expiresAt: string | null;
  layout?: PassportDocumentLayout;
}

function metaLine(createdAt: string, expiresAt: string | null): string {
  const expiry = expiresAt ? `Expires ${formatDate(`${expiresAt}T00:00:00`, "medium")}` : "No expiry";
  return `Added ${formatDate(createdAt, "medium")} · ${expiry}`;
}

/** A supporting document as a grid card or a horizontal list row. */
export default function PassportDocumentCard({
  href,
  label,
  storagePath,
  signedUrl,
  mimeType,
  status,
  createdAt,
  expiresAt,
  layout = "grid",
}: PassportDocumentCardProps) {
  const thumbnail = (
    <PassportDocumentThumbnail
      label={label}
      storagePath={storagePath}
      signedUrl={signedUrl}
      mimeType={mimeType}
      iconSize={layout === "list" ? 24 : 36}
    />
  );

  if (layout === "list") {
    return (
      <Link
        href={href}
        className="flex items-center gap-4 rounded-2xl border border-border bg-card p-3 transition-all duration-200 hover:border-primary focus-visible:outline-2 focus-visible:outline-primary"
      >
        <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
          {thumbnail}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-nunito text-base font-semibold text-card-foreground">{label}</p>
          <p className="truncate text-xs text-muted-foreground">{metaLine(createdAt, expiresAt)}</p>
        </div>
        <PassportStatusChip status={status} className="hidden sm:inline-flex" />
        <IconChevronRight size={18} className="shrink-0 text-muted-foreground" aria-hidden="true" />
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-200 hover:border-primary focus-visible:outline-2 focus-visible:outline-primary"
    >
      <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden border-b border-border bg-muted">
        {thumbnail}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <p className="truncate font-nunito text-base font-semibold text-card-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{metaLine(createdAt, expiresAt)}</p>
        <PassportStatusChip status={status} className="self-start" />
      </div>
    </Link>
  );
}
