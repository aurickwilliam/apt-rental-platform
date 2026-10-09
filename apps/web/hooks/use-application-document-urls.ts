"use client";

import { useCallback, useMemo } from "react";

import { useAsyncResource } from "@/hooks/use-async-resource";
import { resolveApplicationDocumentUrls } from "@/service/applicationDocumentsService";

export type DocumentEntry = { label: string; path: string | null };
export type ResolvedDocument = { label: string; path: string; signedUrl: string | null };

interface ResolvedDocuments {
  resolved: ResolvedDocument[];
  error: string | null;
}

const NOTHING_RESOLVED: ResolvedDocuments = { resolved: [], error: null };
const ACCESS_ERROR = "Unable to access private documents.";

export function useApplicationDocumentUrls(docs: DocumentEntry[]) {
  // Callers often pass a fresh array each render; key on the content.
  const entriesKey = useMemo(() => JSON.stringify(docs), [docs]);

  const load = useCallback(async (): Promise<ResolvedDocuments> => {
    const present = (JSON.parse(entriesKey) as DocumentEntry[]).flatMap((entry) =>
      entry.path ? [{ label: entry.label, path: entry.path }] : [],
    );
    if (present.length === 0) return NOTHING_RESOLVED;

    try {
      const { urls, error } = await resolveApplicationDocumentUrls(present.map((entry) => entry.path));
      return {
        resolved: present.map((entry) => ({ ...entry, signedUrl: urls[entry.path] ?? null })),
        error,
      };
    } catch (err) {
      console.error("Could not sign application documents", err);
      return { resolved: present.map((entry) => ({ ...entry, signedUrl: null })), error: ACCESS_ERROR };
    }
  }, [entriesKey]);

  const { data, loading } = useAsyncResource(load, NOTHING_RESOLVED, ACCESS_ERROR);
  return { resolved: data.resolved, loading, error: data.error };
}
