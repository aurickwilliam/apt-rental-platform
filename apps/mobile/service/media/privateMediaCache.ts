import type { PrivateMediaBucket } from './privateMediaResolver';

export interface SignedUrlCacheEntry {
  signedUrl: string;
  expiresAt: number;
}

const signedUrlCache = new Map<string, SignedUrlCacheEntry>();
const chatMediaRetryKeys = new Set<string>();
let cacheUserId: string | null | undefined;
let cacheGeneration = 0;

function cacheKey(bucket: PrivateMediaBucket, path: string): string {
  return `${bucket}:${path}`;
}

export function getCachedPrivateMediaUrl(
  bucket: PrivateMediaBucket,
  path: string
): SignedUrlCacheEntry | undefined {
  return signedUrlCache.get(cacheKey(bucket, path));
}

export function setCachedPrivateMediaUrl(
  bucket: PrivateMediaBucket,
  path: string,
  entry: SignedUrlCacheEntry
): void {
  signedUrlCache.set(cacheKey(bucket, path), entry);
}

export function claimChatMediaRetry(retryKey: string): boolean {
  if (chatMediaRetryKeys.has(retryKey)) return false;
  chatMediaRetryKeys.add(retryKey);
  return true;
}

export function getPrivateMediaCacheGeneration(): number {
  return cacheGeneration;
}

export function isPrivateMediaCacheGenerationCurrent(generation: number): boolean {
  return cacheGeneration === generation;
}

export function clearPrivateMediaUrlCache(): void {
  signedUrlCache.clear();
  chatMediaRetryKeys.clear();
  cacheUserId = undefined;
  cacheGeneration += 1;
}

/** Clears private access URLs whenever the resolved auth identity changes. */
export function setPrivateMediaCacheUser(userId: string | null): void {
  if (cacheUserId !== userId) {
    signedUrlCache.clear();
    chatMediaRetryKeys.clear();
    cacheUserId = userId;
    cacheGeneration += 1;
  }
}
