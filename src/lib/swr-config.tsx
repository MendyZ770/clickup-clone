"use client";

import { SWRConfig, mutate } from "swr";
import { ReactNode, useEffect } from "react";
import { storageGet } from "@/lib/storage";
import { installOutboxReplay } from "@/lib/offline-queue";

// Cache mémoire du token — mis à jour au montage et au login
let cachedToken: string | null = null;

export function getTokenSync(): string | null {
  return cachedToken;
}

async function refreshTokenCache() {
  cachedToken = await storageGet("mobile_auth_token");
}

const fetcher = async (url: string) => {
  const headers: HeadersInit = {};
  const token = await storageGet("mobile_auth_token");
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(url, { headers }).then((res) => {
    if (!res.ok) {
      if (res.status === 401) throw new Error("Session expirée. Reconnectez-vous.");
      if (res.status === 403) throw new Error("Accès refusé à cette ressource.");
      if (res.status === 404) throw new Error("Ressource introuvable.");
      throw new Error("Impossible de charger les données.");
    }
    return res.json();
  });
};

export function SWRProvider({ children }: { children: ReactNode }) {
  // Charger le token au montage
  useEffect(() => {
    refreshTokenCache();
    return installOutboxReplay();
  }, []);

  return (
    <SWRConfig
      value={{
        fetcher,
        dedupingInterval: 5000,
        refreshInterval: 0,
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        keepPreviousData: true,
        errorRetryCount: 2,
      }}
    >
      {children}
    </SWRConfig>
  );
}

export { mutate };

export async function revalidateFinance(workspaceId?: string) {
  if (workspaceId) {
    await mutate(`/api/finance/accounts?workspaceId=${workspaceId}`);
    await mutate(`/api/finance/categories?workspaceId=${workspaceId}`);
    await mutate(`/api/finance/transactions?workspaceId=${workspaceId}`);
    await mutate(`/api/finance/goals?workspaceId=${workspaceId}`);
    await mutate(`/api/finance/stats?workspaceId=${workspaceId}`);
  }
}

export async function revalidateBudgets() {
  await mutate((key) => typeof key === "string" && key.startsWith("/api/budget"));
}

export async function revalidateTasks() {
  await mutate((key) => typeof key === "string" && key.startsWith("/api/tasks"));
}
