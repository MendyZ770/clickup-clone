import withBundleAnalyzer from "@next/bundle-analyzer";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  compress: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-icons",
      "date-fns",
    ],
    scrollRestoration: true,
  },
  swcMinify: true,
  productionBrowserSourceMaps: false,
};

const isAnalyze = process.env.ANALYZE === "true";
export default isAnalyze ? withBundleAnalyzer({ enabled: true })(nextConfig) : nextConfig;
