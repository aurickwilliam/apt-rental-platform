import { useEffect, useMemo, useState } from 'react';

import {
  resolvePrivateMediaUrls,
  type PrivateMediaBucket,
} from '@/service/media/privateMediaResolver';

type DocEntry = { label: string; path: string | null };
type ResolvedDoc = { label: string; path: string; signedUrl: string | null };

export function useDocumentUrls(docs: DocEntry[], bucket: PrivateMediaBucket = 'application-documents') {
  const [resolved, setResolved] = useState<ResolvedDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const documentKey =
    docs.map((doc) => `${doc.label}\u0000${doc.path ?? ''}`).join('\u0001') +
    `\u0002${bucket}`;

  const entries = useMemo(() => {
    const docsPart = documentKey.split('\u0002')[0] ?? '';
    if (!docsPart) return [];

    return docsPart.split('\u0001').map((entry) => {
      const separatorIndex = entry.indexOf('\u0000');
      return {
        label: entry.slice(0, separatorIndex),
        path: entry.slice(separatorIndex + 1),
      };
    });
  }, [documentKey]);

  useEffect(() => {
    let cancelled = false;

    async function fetchUrls() {
      if (entries.length === 0) {
        if (cancelled) return;
        setResolved([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const { urls, error } = await resolvePrivateMediaUrls(
        bucket,
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
  }, [documentKey, entries, bucket]);

  return { resolved, loading, error };
}
