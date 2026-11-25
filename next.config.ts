import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fotos da landing page (Unsplash) passam pelo otimizador de imagens do Next.
  images: { remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }] },
};

export default nextConfig;
