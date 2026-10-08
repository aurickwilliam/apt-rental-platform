import Image from "next/image";
import { IconFileText } from "@tabler/icons-react";

import PdfThumbnail from "@/app/components/display/PdfThumbnail";

import { isImageDocument } from "./documentTypeIcons";

interface PassportDocumentThumbnailProps {
  label: string;
  storagePath: string;
  signedUrl: string | null;
  mimeType: string | null;
  /** `cover` fills the frame (cards, rows); `contain` shows the whole page. */
  fit?: "cover" | "contain";
  iconSize?: number;
}

export function isPdfDocument(mimeType: string | null, storagePath: string): boolean {
  if (mimeType) return mimeType.toLowerCase() === "application/pdf";
  return storagePath.toLowerCase().endsWith(".pdf");
}

/**
 * Preview for a stored document: the image itself, page 1 of a PDF, or a
 * file icon. Fills its (positioned) parent.
 */
export default function PassportDocumentThumbnail({
  label,
  storagePath,
  signedUrl,
  mimeType,
  fit = "cover",
  iconSize = 36,
}: PassportDocumentThumbnailProps) {
  if (isImageDocument(mimeType, storagePath)) {
    return signedUrl ? (
      <Image
        src={signedUrl}
        alt={label}
        fill
        unoptimized
        className={fit === "cover" ? "object-cover" : "object-contain"}
      />
    ) : (
      <IconFileText size={iconSize} className="text-muted-foreground" aria-hidden="true" />
    );
  }

  if (isPdfDocument(mimeType, storagePath)) {
    return <PdfThumbnail url={signedUrl} cacheKey={storagePath} alt={label} fit={fit} iconSize={iconSize} />;
  }

  return <IconFileText size={iconSize} className="text-muted-foreground" aria-hidden="true" />;
}
