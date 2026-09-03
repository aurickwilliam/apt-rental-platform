import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/supabase", "@repo/constants", "@repo/utils", "@repo/hooks"],
  turbopack: {
    resolveAlias: {
      'react-native': './empty-module.ts',
      '@react-native-async-storage/async-storage': './empty-module.ts',
    },
  },
  images: {
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