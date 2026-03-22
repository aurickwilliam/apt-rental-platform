import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co", },
      { protocol: "https", hostname: "picsum.photos", },
      { protocol: "https", hostname: "images.unsplash.com", },
      { protocol: "https", hostname: "unpkg.com" },
    ]
  }
};

export default nextConfig;
