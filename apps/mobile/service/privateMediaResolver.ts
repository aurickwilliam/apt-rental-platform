import { supabase } from '@repo/supabase';

import {
  claimChatMediaRetry,
  getCachedPrivateMediaUrl,
  getPrivateMediaCacheGeneration,
  isPrivateMediaCacheGenerationCurrent,
  setCachedPrivateMediaUrl,
} from './privateMediaCache';

export { clearPrivateMediaUrlCache, setPrivateMediaCacheUser } from './privateMediaCache';

export type PrivateMediaBucket =
  | 'application-documents'
  | 'chat-images'
  | 'maintenance-images';

export type PrivateMediaUrlMap = Record<string, string | null>;

export interface PrivateMediaResolution {
  urls: PrivateMediaUrlMap;
  error: string | null;
}

interface ResolvePrivateMediaOptions {
  forceRefreshPaths?: readonly string[];
}

export interface ChatMediaRetryResult extends PrivateMediaResolution {
  didRetry: boolean;
}

export const PRIVATE_MEDIA_SIGNED_URL_TTL_SECONDS = 60 * 60;
export const PRIVATE_MEDIA_CACHE_TTL_MS = 55 * 60 * 1000;
export const CHAT_VISIBLE_MEDIA_REFRESH_AGE_MS = 45 * 60 * 1000;

function uniquePaths(paths: readonly string[]): string[] {
  return [...new Set(paths.filter(Boolean))];
}

/**
 * Resolves private storage paths to time-limited URLs without changing the
 * stored paths. Cache keys include their bucket so identical paths in two
 * private buckets cannot share an authorization result.
 */
export async function resolvePrivateMediaUrls(
  bucket: PrivateMediaBucket,
  paths: readonly string[],
  options: ResolvePrivateMediaOptions = {}
): Promise<PrivateMediaResolution> {
  const requestedPaths = uniquePaths(paths);
  if (requestedPaths.length === 0) return { urls: {}, error: null };

  const forceRefreshPaths = new Set(uniquePaths(options.forceRefreshPaths ?? []));
  const now = Date.now();
  const urls: PrivateMediaUrlMap = {};
  const missingPaths: string[] = [];

  for (const path of requestedPaths) {
    const cached = getCachedPrivateMediaUrl(bucket, path);

    if (!forceRefreshPaths.has(path) && cached && cached.expiresAt > now) {
      urls[path] = cached.signedUrl;
    } else {
      missingPaths.push(path);
    }
  }

  if (missingPaths.length === 0) return { urls, error: null };

  const cacheGeneration = getPrivateMediaCacheGeneration();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrls(missingPaths, PRIVATE_MEDIA_SIGNED_URL_TTL_SECONDS);

  if (error) {
    return {
      urls: {
        ...urls,
        ...Object.fromEntries(missingPaths.map((path) => [path, null])),
      },
      error: 'Unable to access private media.',
    };
  }

  const signedUrlByPath = new Map(
    (data ?? [])
      .filter((entry) => entry.path && entry.signedUrl && !entry.error)
      .map((entry) => [entry.path, entry.signedUrl] as const)
  );
  let hasMissingResult = false;

  for (const path of missingPaths) {
    const signedUrl = signedUrlByPath.get(path);
    if (!signedUrl) {
      urls[path] = null;
      hasMissingResult = true;
      continue;
    }

    if (isPrivateMediaCacheGenerationCurrent(cacheGeneration)) {
      setCachedPrivateMediaUrl(bucket, path, {
        signedUrl,
        expiresAt: now + PRIVATE_MEDIA_CACHE_TTL_MS,
      });
    }
    urls[path] = signedUrl;
  }

  return {
    urls,
    error: hasMissingResult ? 'Some private media could not be accessed.' : null,
  };
}

/**
 * Re-signs only visible chat paths whose cached URL is absent or has reached
 * the 45-minute refresh threshold. Repeated visibility notifications reuse the
 * refreshed cache entry instead of issuing another signing request.
 */
export async function refreshVisibleChatMediaUrls(
  paths: readonly string[]
): Promise<PrivateMediaResolution> {
  const now = Date.now();
  const pathsToRefresh = uniquePaths(paths).filter((path) => {
    const cached = getCachedPrivateMediaUrl('chat-images', path);
    if (!cached) return true;

    const resolvedAt = cached.expiresAt - PRIVATE_MEDIA_CACHE_TTL_MS;
    return now - resolvedAt >= CHAT_VISIBLE_MEDIA_REFRESH_AGE_MS;
  });

  return resolvePrivateMediaUrls('chat-images', paths, {
    forceRefreshPaths: pathsToRefresh,
  });
}

/**
 * Allows a chat bubble to recover once from an authorization/expiry-like image
 * load failure. The retry guard is scoped to the message media identity and is
 * cleared with the process-local cache on sign-out or account change.
 */
export async function retryChatMediaUrlOnce(
  messageId: string,
  mediaKind: 'attachment' | 'thumbnail',
  path: string
): Promise<ChatMediaRetryResult> {
  const retryKey = `${messageId}:${mediaKind}:${path}`;
  if (!claimChatMediaRetry(retryKey)) {
    return { urls: {}, error: null, didRetry: false };
  }

  const resolution = await resolvePrivateMediaUrls('chat-images', [path], {
    forceRefreshPaths: [path],
  });

  return { ...resolution, didRetry: true };
}
