import type { NextConfig } from "next";

// Resized copies are cached this long (Next's default is 4 hours). Every refresh pulls the
// full-size original from Supabase again, and listing photos are uploaded under unique,
// never-overwritten paths, so a long lifetime never serves a stale picture.
const IMAGE_CACHE_SECONDS = 60 * 60 * 24 * 30;

const nextConfig: NextConfig = {
  transpilePackages: [
    "@repo/supabase",
    "@repo/constants",
    "@repo/utils",
    "@repo/hooks",
    "@repo/passport",
    "@repo/i18n",
  ],
  turbopack: {
    resolveAlias: {
      'react-native': './empty-module.ts',
      '@react-native-async-storage/async-storage': './empty-module.ts',
    },
  },
  images: {
    minimumCacheTTL: IMAGE_CACHE_SECONDS,
    // IPv6-only networks (DNS64/NAT64) resolve hosts to 64:ff9b:: addresses, which the
    // optimizer rejects as private. Development only; production keeps the SSRF guard.
    dangerouslyAllowLocalIP: process.env.NODE_ENV === "development",
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "unpkg.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "*.googleusercontent.com" },
    ],
  },
};

export default nextConfig;