"use client";

import { useEffect, useMemo, useState } from "react";

import { resolveApplicationDocumentUrls } from "@/service/applicationDocumentsService";

export type DocumentEntry = { label: string; path: string | null };
export type ResolvedDocument = { label: string; path: string; signedUrl: string | null };

export function useApplicationDocumentUrls(docs: DocumentEntry[]) {
  const [resolved, setResolved] = useState<ResolvedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const entriesKey = useMemo(() => JSON.stringify(docs), [docs]);

  useEffect(() => {
    let cancelled = false;

    const parsed = JSON.parse(entriesKey) as DocumentEntry[];
    const present: { label: string; path: string }[] = parsed.flatMap((entry) =>
      entry.path ? [{ label: entry.label, path: entry.path }] : [],
    );

    if (present.length === 0) {
      setResolved([]);
      setLoading(false);
      setError(null);
      return;
    }

    async function fetchUrls() {
      setLoading(true);
      const { urls, error: resolutionError } = await resolveApplicationDocumentUrls(
        present.map((entry) => entry.path),
      );
      if (cancelled) return;
      setResolved(
        present.map((entry) => ({
          label: entry.label,
          path: entry.path,
          signedUrl: urls[entry.path] ?? null,
        })),
      );
      setError(resolutionError);
      setLoading(false);
    }

    void fetchUrls().catch(() => {
      if (cancelled) return;
      setResolved(present.map((entry) => ({ ...entry, signedUrl: null })));
      setError("Unable to access private documents.");
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [entriesKey]);

  return { resolved, loading, error };
}
