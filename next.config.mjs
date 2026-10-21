import withBundleAnalyzer from "@next/bundle-analyzer";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  // L'enregistrement est fait par le layout, qui l'ignore dans Capacitor.
  register: false,
  cacheOnFrontEndNav: false,
  aggressiveFrontEndNavCaching: false,
  // Le rejeu de l'outbox gère la reconnexion ; un reload global l'interromprait.
  reloadOnOnline: false,
  caches: [],
  // Injecte les handlers push/notificationclick dans le SW Workbox généré.
  customWorkerSrc: "worker",
  customWorkerDest: "public",
  customWorkerPrefix: "worker",
  workboxOptions: {
    importScripts: [],
    runtimeCaching: [
      {
        urlPattern: ({ url, sameOrigin }) =>
          sameOrigin && url.pathname.startsWith("/api/"),
        handler: "NetworkOnly",
      },
      {
        urlPattern: ({ url, sameOrigin }) =>
          sameOrigin &&
          (url.pathname.startsWith("/auth/") ||
            url.pathname === "/login" ||
            url.pathname === "/register"),
        handler: "NetworkOnly",
      },
      {
        urlPattern: ({ url }) =>
          url.pathname.startsWith("/_next/static/") ||
          url.pathname.startsWith("/_next/image"),
        handler: "CacheFirst",
        options: {
          cacheName: "static",
          expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
        },
      },
      {
        urlPattern: ({ request }) =>
          ["style", "script", "font", "image"].includes(request.destination),
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "assets",
          expiration: { maxEntries: 120, maxAgeSeconds: 7 * 24 * 60 * 60 },
        },
      },
      {
        urlPattern: ({ request, sameOrigin }) =>
          sameOrigin && request.mode === "navigate",
        handler: "NetworkFirst",
        options: {
          cacheName: "pages",
          networkTimeoutSeconds: 4,
          expiration: { maxEntries: 32, maxAgeSeconds: 60 * 60 },
          cacheableResponse: { statuses: [200] },
          plugins: [
            {
              handlerDidError: async () =>
                (await caches.match("/offline")) ?? Response.error(),
            },
          ],
        },
      },
    ],
    additionalManifestEntries: [{ url: "/offline", revision: "v1" }],
  },
});

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
  productionBrowserSourceMaps: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          ...(process.env.NODE_ENV === "production" ? [{
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          }] : []),
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src 'self' fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' https: wss: ws:; frame-ancestors 'none'; base-uri 'self'; form-action 'self';",
          },
        ],
      },
    ];
  },
};

const isAnalyze = process.env.ANALYZE === "true";
export default isAnalyze ? withBundleAnalyzer({ enabled: true })(withPWA(nextConfig)) : withPWA(nextConfig);
