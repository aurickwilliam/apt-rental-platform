"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Spinner } from "@heroui/react";
import { IconDownload, IconFileText, IconPrinter } from "@tabler/icons-react";
import { paginateDocx } from "./paginateDocx";
import "./lease-print.css";

interface LeaseDocumentPreviewProps {
  sourceHref: string;
  fileName: string;
  isPdf: boolean;
}

export default function LeaseDocumentPreview({
  sourceHref,
  fileName,
  isPdf,
}: LeaseDocumentPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfRef = useRef<HTMLIFrameElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const updateCurrentPage = () => {
    const container = containerRef.current;
    if (!container) return;
    const center =
      container.getBoundingClientRect().top + container.clientHeight / 2;
    const pages = container.querySelectorAll<HTMLElement>(
      ".docx-wrapper > section.docx",
    );
    let closestPage = 1;
    let distance = Infinity;
    pages.forEach((page, index) => {
      const rect = page.getBoundingClientRect();
      const gap = Math.max(rect.top - center, center - rect.bottom, 0);
      if (gap < distance) {
        distance = gap;
        closestPage = index + 1;
      }
    });
    setCurrentPage(closestPage);
  };

  useEffect(() => {
    if (isPdf) return;
    const controller = new AbortController();
    const container = containerRef.current;
    if (!container) return;

    async function loadDocument() {
      try {
        const response = await fetch(sourceHref, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok)
          throw new Error(`Lease preview request failed (${response.status})`);

        const document = await response.arrayBuffer();
        const { renderAsync } = await import("docx-preview");
        if (controller.signal.aborted || !container) return;

        await renderAsync(document, container, container, {
          renderAltChunks: false,
          ignoreLastRenderedPageBreak: false,
        });
        if (controller.signal.aborted) return;
        const pages = paginateDocx(container);
        setPageCount(pages.length);
        setCurrentPage(1);
        setLoading(false);
      } catch (cause) {
        if (controller.signal.aborted) return;
        console.error("Unable to preview lease agreement", cause);
        setError(
          "Unable to preview this lease agreement. Refresh and try again.",
        );
        setLoading(false);
      }
    }

    void loadDocument();
    return () => {
      controller.abort();
      container.replaceChildren();
    };
  }, [isPdf, sourceHref]);

  const handlePrint = () => {
    if (isPdf) {
      pdfRef.current?.contentWindow?.print();
    } else {
      window.print();
    }
  };

  return (
    <section
      aria-label="Lease agreement preview"
      className="lease-document-preview min-w-0 overflow-hidden rounded-xl border border-border bg-card"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
        <p className="min-w-0 wrap-break-word font-nunito text-base font-semibold text-foreground">
          {fileName}
        </p>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {!isPdf && pageCount > 0 ? (
            <span className="mr-2 text-sm text-muted-foreground">
              Page {currentPage} of {pageCount}
            </span>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            onPress={() => window.location.assign(`${sourceHref}?download=1`)}
          >
            <IconDownload size={18} aria-hidden="true" />
            Download
          </Button>
          <Button
            variant="outline"
            size="sm"
            isDisabled={loading || Boolean(error)}
            onPress={handlePrint}
          >
            <IconPrinter size={18} aria-hidden="true" />
            Print
          </Button>
        </div>
      </div>

      {loading ? (
        <div
          role="status"
          className="flex min-h-96 flex-col items-center justify-center gap-3 text-muted-foreground"
        >
          <IconFileText
            size={40}
            stroke={1.5}
            aria-hidden="true"
            className="text-primary"
          />
          <div className="flex flex-row gap-3 items-center">
            <Spinner
              size="md"
              className="text-primary"
              aria-label="Loading lease agreement"
            />
            <p className="text-sm">Loading lease agreement…</p>
          </div>
        </div>
      ) : null}
      {error ? (
        <p role="alert" className="p-4 text-sm text-danger">
          {error}
        </p>
      ) : null}

      {isPdf ? (
        <iframe
          ref={pdfRef}
          title={`Preview of ${fileName}`}
          src={sourceHref}
          onLoad={() => setLoading(false)}
          onError={() => {
            setError(
              "Unable to preview this lease agreement. Refresh and try again.",
            );
            setLoading(false);
          }}
          className={loading ? "hidden" : "h-[80vh] min-h-96 w-full"}
        />
      ) : (
        <div
          ref={containerRef}
          onScroll={updateCurrentPage}
          className="lease-print-content h-[80vh] min-h-96 overflow-auto p-4"
        />
      )}
    </section>
  );
}
