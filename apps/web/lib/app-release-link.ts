// Checks that a published APK link really downloads, so the admin sees a broken
// link before users do. Admin-controlled URLs are fetched from the server, so
// only public https hosts are followed, hop by hop, and never IP literals or
// internal names.

export type LinkCheck =
  | { state: "ok"; bytes: number | null }
  | { state: "missing"; status: number }
  | { state: "unreachable" };

const MAX_REDIRECTS = 5;
const CHECK_TIMEOUT_MS = 8000;
const BYTES_PER_MB = 1024 * 1024;
const INTERNAL_SUFFIXES = [".local", ".internal", ".localhost", ".lan", ".home"];

export function parseCheckableUrl(value: string): URL | null {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase();
  if (url.protocol !== "https:" || url.username || url.password) return null;
  if (!host.includes(".") || host.includes(":") || host.startsWith("[")) return null;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return null;
  if (INTERNAL_SUFFIXES.some((suffix) => host.endsWith(suffix))) return null;
  return url;
}

export async function checkDownloadLink(
  link: string,
  fetchImpl: typeof fetch = fetch,
): Promise<LinkCheck> {
  let current = parseCheckableUrl(link);
  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    if (!current) return { state: "unreachable" };
    try {
      const response = await fetchImpl(current, {
        method: "HEAD",
        redirect: "manual",
        cache: "no-store",
        signal: AbortSignal.timeout(CHECK_TIMEOUT_MS),
      });
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        current = location ? parseCheckableUrl(new URL(location, current).toString()) : null;
        continue;
      }
      if (response.ok) {
        const length = Number(response.headers.get("content-length"));
        return { state: "ok", bytes: Number.isFinite(length) && length > 0 ? length : null };
      }
      return { state: "missing", status: response.status };
    } catch {
      return { state: "unreachable" };
    }
  }
  return { state: "unreachable" };
}

export function formatBytes(bytes: number): string {
  return bytes >= BYTES_PER_MB ? `${Math.round(bytes / BYTES_PER_MB)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** "owner/repo" when the link points at a GitHub release asset. */
export function githubRepoFromUrl(link: string): string | null {
  const match = /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+)\//.exec(link);
  return match ? `${match[1]}/${match[2]}` : null;
}
