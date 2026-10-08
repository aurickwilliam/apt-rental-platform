"use client";

import { useEffect, useRef, useState } from "react";
import { IconFileText } from "@tabler/icons-react";

// Rendered first pages, keyed by storage path (signed URLs change per read).
const thumbnailCache = new Map<string, string>();
const THUMBNAIL_WIDTH_PX = 640;

async function renderFirstPage(url: string): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

  const loadingTask = pdfjs.getDocument({ url });
  try {
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: THUMBNAIL_WIDTH_PX / base.width });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    await page.render({ canvas, viewport }).promise;
    return canvas.toDataURL("image/png");
  } finally {
    // Releases the document and its worker-side resources.
    void loadingTask.destroy();
  }
}

interface PdfThumbnailProps {
  /** Signed URL of the PDF. */
  url: string | null;
  /** Stable cache key, e.g. the storage path. */
  cacheKey: string;
  alt: string;
  /** `cover` crops to the top of page 1 (cards); `contain` shows the whole page. */
  fit?: "cover" | "contain";
  iconSize?: number;
}

/**
 * First-page PDF preview, rendered client-side with pdf.js once the element
 * scrolls into view. Falls back to a file icon while loading or on failure.
 */
export default function PdfThumbnail({ url, cacheKey, alt, fit = "cover", iconSize = 36 }: PdfThumbnailProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rendered, setRendered] = useState<{ key: string; src: string } | null>(null);
  const src = thumbnailCache.get(cacheKey) ?? (rendered?.key === cacheKey ? rendered.src : null);

  useEffect(() => {
    const element = containerRef.current;
    if (!url || !element || thumbnailCache.has(cacheKey)) return;

    let cancelled = false;
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      renderFirstPage(url)
        .then((dataUrl) => {
          thumbnailCache.set(cacheKey, dataUrl);
          if (!cancelled) setRendered({ key: cacheKey, src: dataUrl });
        })
        .catch((err: unknown) => console.warn("PDF preview failed", err));
    });
    observer.observe(element);

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [url, cacheKey]);

  return (
    <div ref={containerRef} className="relative flex size-full items-center justify-center">
      {src ? (
        // Data URL from a canvas render; next/image adds nothing here.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className={`size-full bg-white ${fit === "cover" ? "object-cover object-top" : "object-contain"}`}
        />
      ) : (
        <span className="flex flex-col items-center gap-1 text-muted-foreground">
          <IconFileText size={iconSize} aria-hidden="true" />
          <span className="text-xs font-semibold">PDF</span>
        </span>
      )}
    </div>
  );
}
