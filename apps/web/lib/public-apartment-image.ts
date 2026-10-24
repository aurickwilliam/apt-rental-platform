/**
 * Opt in only known public listing images. This policy is deliberately narrower
 * than next.config's shared remotePatterns: private/signed media must stay on
 * their existing authenticated browser paths, never the public image optimizer.
 */
export function canOptimizePublicApartmentImage(src: string, supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL): boolean {
  // Reject encoded paths before URL normalization (including encoded dot segments).
  if (src.includes("%")) return false;
  if (src.startsWith("/images/") && !src.includes("?") && !src.includes("#")) {
    return !src.includes("..") && !src.includes("%") && /\.(jpe?g|png|webp|avif)$/i.test(src);
  }

  try {
    const url = new URL(src);
    if (url.protocol !== "https:" || url.username || url.password || url.hash || url.pathname.includes("%")) return false;
    if (url.hostname === "images.unsplash.com" && url.port === "") {
      return url.pathname.startsWith("/photo-") && !url.searchParams.has("token");
    }
    if (!supabaseUrl || url.origin !== new URL(supabaseUrl).origin || url.search) return false;
    return url.pathname.startsWith("/storage/v1/object/public/apartment-images/") && /\.(jpe?g|png|webp|avif)$/i.test(url.pathname);
  } catch {
    return false;
  }
}
