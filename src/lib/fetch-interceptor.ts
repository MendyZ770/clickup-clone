"use client";

function sameOriginApiRequest(input: RequestInfo | URL): boolean {
  try {
    const url =
      typeof input === "string"
        ? new URL(input, window.location.origin)
        : input instanceof URL
          ? input
          : new URL(input.url, window.location.origin);
    return (
      url.origin === window.location.origin && url.pathname.startsWith("/api/")
    );
  } catch {
    return false;
  }
}

export function setupFetchInterceptor() {
  if (typeof window === "undefined") return;
  const originalFetch = window.fetch;
  window.fetch = function (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const token = localStorage.getItem("mobile_auth_token");
    // Ne jamais envoyer le JWT à une origine tierce
    if (token && sameOriginApiRequest(input)) {
      const newInit: RequestInit = init ?? {};
      const headers = new Headers(newInit.headers);
      if (!headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      newInit.headers = headers;
      return originalFetch(input, newInit);
    }
    return originalFetch(input, init);
  };
}
