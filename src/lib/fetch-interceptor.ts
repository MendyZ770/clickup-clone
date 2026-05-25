"use client";

export function setupFetchInterceptor() {
  if (typeof window === "undefined") return;
  const originalFetch = window.fetch;
  window.fetch = function (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const token = localStorage.getItem("mobile_auth_token");
    if (token) {
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
