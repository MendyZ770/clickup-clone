"use client";

import { SWRConfig } from "swr";
import { ReactNode } from "react";

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

export function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher,
        dedupingInterval: 2000,      // dedupe requests within 2s
        refreshInterval: 0,            // no auto-refresh by default
        revalidateOnFocus: false,    // don't revalidate on tab focus
        revalidateOnReconnect: true, // revalidate on network reconnect
        errorRetryCount: 2,
      }}
    >
      {children}
    </SWRConfig>
  );
}
