type PushPayload = {
  title?: string;
  body?: string;
  tag?: string;
  data?: { url?: string };
};

interface PushEventLike {
  data: { json(): unknown; text(): string } | null;
  waitUntil(promise: Promise<unknown>): void;
}

interface NotificationClickEventLike {
  notification: { close(): void; data?: { url?: string } };
  waitUntil(promise: Promise<unknown>): void;
}

interface WindowClientLike {
  url: string;
  focus(): Promise<unknown>;
}

interface ServiceWorkerScopeLike {
  location: { origin: string };
  registration: {
    showNotification(title: string, options?: Record<string, unknown>): Promise<void>;
  };
  clients: {
    matchAll(options: { type: string; includeUncontrolled: boolean }): Promise<WindowClientLike[]>;
    openWindow(url: string): Promise<unknown>;
  };
  addEventListener(type: "push", listener: (event: PushEventLike) => void): void;
  addEventListener(
    type: "notificationclick",
    listener: (event: NotificationClickEventLike) => void
  ): void;
}

// Le worker est importé par le SW Workbox généré (next-pwa customWorkerSrc).
const sw = self as unknown as ServiceWorkerScopeLike;

function parsePayload(data: PushEventLike["data"]): PushPayload {
  if (!data) return {};
  try {
    const parsed = data.json() as {
      title?: unknown;
      body?: unknown;
      tag?: unknown;
      data?: { url?: unknown };
    };
    return {
      title: typeof parsed.title === "string" ? parsed.title : undefined,
      body: typeof parsed.body === "string" ? parsed.body : undefined,
      tag: typeof parsed.tag === "string" ? parsed.tag : undefined,
      data:
        parsed.data && typeof parsed.data.url === "string"
          ? { url: parsed.data.url }
          : undefined,
    };
  } catch {
    return { body: data.text() };
  }
}

// Un push ne doit jamais pouvoir ouvrir une origine tierce.
function resolveTarget(raw: string | undefined): string {
  const fallback = "/dashboard";
  if (!raw) return fallback;
  try {
    const url = new URL(raw, sw.location.origin);
    if (url.origin !== sw.location.origin) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

sw.addEventListener("push", (event) => {
  const payload = parsePayload(event.data);
  event.waitUntil(
    sw.registration.showNotification(payload.title || "Done", {
      body: payload.body || "Nouvelle notification",
      tag: payload.tag || "done-notification",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url: resolveTarget(payload.data?.url) },
    })
  );
});

sw.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(resolveTarget(event.notification.data?.url), sw.location.origin).href;

  event.waitUntil(
    (async () => {
      const clients = await sw.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of clients) {
        if (client.url === target) return client.focus();
      }
      return sw.clients.openWindow(target);
    })()
  );
});
