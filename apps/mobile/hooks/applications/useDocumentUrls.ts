import { useEffect, useMemo, useState } from 'react';

import { resolvePrivateMediaUrls } from '@/service/privateMediaResolver';

type DocEntry = { label: string; path: string | null };
type ResolvedDoc = { label: string; path: string; signedUrl: string | null };

export function useDocumentUrls(docs: DocEntry[]) {
  const [resolved, setResolved] = useState<ResolvedDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const documentKey = docs
    .map((doc) => `${doc.label}\u0000${doc.path ?? ''}`)
    .join('\u0001');

  const entries = useMemo(() => {
    if (!documentKey) return [];

    return documentKey.split('\u0001').map((entry) => {
      const separatorIndex = entry.indexOf('\u0000');
      return {
        label: entry.slice(0, separatorIndex),
        path: entry.slice(separatorIndex + 1),
      };
    });
  }, [documentKey]);

  useEffect(() => {
    let cancelled = false;

    if (!entries.length) {
      setResolved([]);
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    async function fetchUrls() {
      setLoading(true);
      const { urls, error } = await resolvePrivateMediaUrls(
        'application-documents',
        entries.map((entry) => entry.path)
      );

      if (cancelled) return;

      setResolved(
        entries.map((entry) => ({
          label: entry.label,
          path: entry.path,
          signedUrl: urls[entry.path] ?? null,
        }))
      );
      setError(error);
      setLoading(false);
    }

    fetchUrls().catch(() => {
      if (cancelled) return;
      setResolved(entries.map((entry) => ({ ...entry, signedUrl: null })));
      setError('Unable to access private documents.');
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [documentKey, entries]);

  return { resolved, loading, error };
}
