const CACHE_NAME = "done-v1";
const STATIC_ASSETS = [
  "/",
  "/dashboard",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
  "/favicon.svg",
];

const API_ROUTES = ["/api/"];
const PAGE_ROUTES = ["/dashboard", "/my-tasks", "/settings", "/goals", "/notes", "/reminders", "/time-tracking", "/calendar", "/notifications", "/search"];

// Install: pre-cache static shell
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch: route strategies
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Network-only for API calls
  if (API_ROUTES.some((route) => url.pathname.startsWith(route))) {
    event.respondWith(networkOnly(request));
    return;
  }

  // Stale-while-revalidate for page navigations (HTML)
  if (request.mode === "navigate") {
    event.respondWith(staleWhileRevalidate(request, "/dashboard"));
    return;
  }

  // Cache-first for static assets (JS, CSS, images, fonts)
  if (
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "image" ||
    request.destination === "font" ||
    url.pathname.startsWith("/_next/")
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Default: network with cache fallback
  event.respondWith(networkWithCacheFallback(request));
});

// Strategies
async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch (err) {
    // Return a simple offline JSON for API calls
    if (request.headers.get("accept")?.includes("application/json")) {
      return new Response(JSON.stringify({ offline: true }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }
    throw err;
  }
}

async function staleWhileRevalidate(request, fallbackUrl) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);

  return cached || fetchPromise || (fallbackUrl ? cache.match(fallbackUrl) : undefined);
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return new Response("", { status: 404 });
  }
}

async function networkWithCacheFallback(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cache = await caches.open(CACHE_NAME);
    return cache.match(request);
  }
}
