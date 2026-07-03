import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@repo/supabase';

const BUCKET = 'application-documents';
const EXPIRES_IN = 60 * 55; // 55 min
const TTL_MS = 55 * 60 * 1000;

// Module-level cache — persists across component mounts/unmounts
const urlCache = new Map<string, { signedUrl: string; expiresAt: number }>();

type DocEntry = { label: string; path: string | null };
type ResolvedDoc = { label: string; path: string; signedUrl: string | null };

export function useDocumentUrls(docs: DocEntry[]) {
  const [resolved, setResolved] = useState<ResolvedDoc[]>([]);
  const [loading, setLoading] = useState(true);

  const cacheKey = useMemo(
    () => docs.map((d) => d.path).join(','),
    [docs]
  );

  const entries = useMemo(
    () => docs.filter((d): d is { label: string; path: string } => !!d.path),
    [docs]
  );


  useEffect(() => {
    if (!entries.length) {
      setResolved([]);
      setLoading(false);
      return;
    }

    async function fetchUrls() {
      setLoading(true);
      const now = Date.now();

      // Split into cache hits and misses
      const hits: ResolvedDoc[] = [];
      const misses: { label: string; path: string }[] = [];

      for (const entry of entries) {
        const cached = urlCache.get(entry.path);
        if (cached && cached.expiresAt > now) {
          hits.push({ label: entry.label, path: entry.path, signedUrl: cached.signedUrl });
        } else {
          misses.push(entry);
        }
      }

      // Only fetch what isn't cached
      let freshResults: ResolvedDoc[] = [];
      if (misses.length > 0) {
        // Use createSignedUrls (batch) instead of one call per file
        const paths = misses.map((m) => m.path);
        const { data } = await supabase.storage
          .from(BUCKET)
          .createSignedUrls(paths, EXPIRES_IN);

        freshResults = misses.map((miss) => {
          const match = data?.find((d) => d.path === miss.path);
          const signedUrl = match?.signedUrl ?? null;

          if (signedUrl) {
            urlCache.set(miss.path, { signedUrl, expiresAt: now + TTL_MS });
          }

          return { label: miss.label, path: miss.path, signedUrl };
        });
      }

      // Merge and preserve original order
      const all = entries.map((e) => {
        return (
          hits.find((h) => h.path === e.path) ??
          freshResults.find((f) => f.path === e.path) ??
          { label: e.label, path: e.path, signedUrl: null }
        );
      });

      setResolved(all);
      setLoading(false);
    }

    fetchUrls();
  }, [cacheKey, entries]);

  return { resolved, loading };
}
