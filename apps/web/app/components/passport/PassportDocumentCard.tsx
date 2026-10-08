import Image from "next/image";
import Link from "next/link";
import { IconFileText } from "@tabler/icons-react";

import type { PassportDocumentStatus } from "@repo/passport";

import PassportStatusChip from "./PassportStatusChip";
import { isImageDocument } from "./documentTypeIcons";

interface PassportDocumentCardProps {
  href: string;
  label: string;
  storagePath: string;
  signedUrl: string | null;
  mimeType: string | null;
  status: PassportDocumentStatus;
}

export default function PassportDocumentCard({
  href,
  label,
  storagePath,
  signedUrl,
  mimeType,
  status,
}: PassportDocumentCardProps) {
  const isImage = isImageDocument(mimeType, storagePath);
  const isPdf = !isImage && (mimeType === "application/pdf" || storagePath.toLowerCase().endsWith(".pdf"));

  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-2xl border border-border bg-card transition-all duration-200 hover:border-primary focus-visible:outline-2 focus-visible:outline-primary"
    >
      <div className="relative flex aspect-square w-full items-center justify-center bg-muted">
        {isImage && signedUrl ? (
          <Image src={signedUrl} alt={label} fill unoptimized className="object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-1 text-muted-foreground">
            <IconFileText size={40} aria-hidden="true" />
            {isPdf ? <span className="text-xs font-semibold">PDF</span> : null}
          </span>
        )}
        {status !== "unverified" ? <PassportStatusChip status={status} className="absolute top-2 left-2" /> : null}
      </div>
      <div className="p-3">
        <p className="truncate font-nunito text-base font-semibold text-card-foreground">{label}</p>
      </div>
    </Link>
  );
}
