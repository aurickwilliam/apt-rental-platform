/**
 * Giphy search for the web composer.
 *
 * Mobile uses `@giphy/react-native-sdk`, which has no web equivalent worth
 * pulling in, so web talks to the public Giphy REST API directly. Trending is
 * the default view and the same endpoint backs search.
 *
 * Selected GIFs are never downloaded or re-uploaded: the CDN URL is stored
 * verbatim on the row (`attachment_url`), exactly like mobile's `externalUrl`
 * path, and rendered directly without a signed URL.
 */

const GIPHY_API_BASE = "https://api.giphy.com/v1";

/** Small "downsized" rendition — enough for a chat bubble without the weight. */
const GIF_RENDITION = "downsized_medium";

const GIF_RESULT_LIMIT = 24;

export interface GiphyGif {
  id: string;
  /** CDN URL rendered directly; stored verbatim on the chat row. */
  url: string;
  previewUrl: string;
  width: number;
  height: number;
  title: string;
}

interface GiphyApiImage {
  url?: string;
  width?: number;
  height?: number;
}

interface GiphyApiResult {
  id: string;
  title?: string;
  images?: Record<string, GiphyApiImage | undefined>;
}

interface GiphyApiResponse {
  data?: GiphyApiResult[];
}

function getGiphyApiKey(): string | undefined {
  // Public by design — the key only rate-limits the anonymous beta tier, and
  // it reaches the browser either way. Never commit a real value.
  return process.env.NEXT_PUBLIC_GIPHY_API_KEY;
}

function toGif(result: GiphyApiResult): GiphyGif | null {
  const images = result.images ?? {};
  const main = images[GIF_RENDITION] ?? images.downsized ?? images.fixed_height;
  const preview = images.downsized_small ?? images.fixed_height_small ?? main;

  if (!main?.url) return null;

  return {
    id: result.id,
    url: main.url,
    previewUrl: preview?.url ?? main.url,
    width: main.width ?? 0,
    height: main.height ?? 0,
    title: result.title ?? "",
  };
}

/**
 * Fetches trending GIFs, or search results when `query` is non-empty. Returns
 * an empty list on any failure — the composer shows an empty state rather than
 * an error, because a GIF picker is a convenience, not a required path.
 */
export async function fetchGiphyGifs(query: string): Promise<GiphyGif[]> {
  const apiKey = getGiphyApiKey();
  if (!apiKey) {
    console.warn("NEXT_PUBLIC_GIPHY_API_KEY is not set; GIF search is unavailable.");
    return [];
  }

  const trimmed = query.trim();
  const path = trimmed
    ? `/gifs/search?api_key=${encodeURIComponent(apiKey)}&q=${encodeURIComponent(trimmed)}&limit=${GIF_RESULT_LIMIT}&rating=g`
    : `/gifs/trending?api_key=${encodeURIComponent(apiKey)}&limit=${GIF_RESULT_LIMIT}&rating=g`;

  try {
    const response = await fetch(`${GIPHY_API_BASE}${path}`);
    if (!response.ok) {
      console.error("Giphy request failed:", response.status);
      return [];
    }

    const payload = (await response.json()) as GiphyApiResponse;
    return (payload.data ?? [])
      .map(toGif)
      .filter((gif): gif is GiphyGif => gif !== null);
  } catch (err) {
    console.error("Giphy request error:", err);
    return [];
  }
}