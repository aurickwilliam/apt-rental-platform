import { useEffect, useMemo, useRef, useState } from 'react';

import {
  resolveApplicationDocumentUrls,
  resolvePrivateMediaUrls,
  type PrivateMediaBucket,
} from '@/service/media/privateMediaResolver';

type DocEntry = { label: string; path: string | null };
type ResolvedDoc = { label: string; path: string; signedUrl: string | null };

export function useDocumentUrls(docs: DocEntry[], bucket: PrivateMediaBucket = 'application-documents') {
  const [resolved, setResolved] = useState<ResolvedDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Ref, not state: read inside the effect to decide whether this pass is the
  // initial one. Later passes re-resolve URLs without flipping `loading`, so
  // callers rendering a placeholder don't flash it on every entry change.
  const hasResolvedOnce = useRef(false);

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
        hasResolvedOnce.current = true;
        return;
      }

      setLoading(!hasResolvedOnce.current);
      const paths = entries.map((entry) => entry.path);
      // Application documents may include a passport-attached verified ID
      // that lives in another bucket; route those by path shape.
      const { urls, error } =
        bucket === 'application-documents'
          ? await resolveApplicationDocumentUrls(paths)
          : await resolvePrivateMediaUrls(bucket, paths);

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
      hasResolvedOnce.current = true;
    }

    fetchUrls().catch(() => {
      if (cancelled) return;
      setResolved(entries.map((entry) => ({ ...entry, signedUrl: null })));
      setError('Unable to access private documents.');
      setLoading(false);
      hasResolvedOnce.current = true;
    });

    return () => {
      cancelled = true;
    };
  }, [documentKey, entries, bucket]);

  return { resolved, loading, error };
}
