"use client";

import { SWRConfig, mutate } from "swr";
import { ReactNode } from "react";

const fetcher = (url: string) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("mobile_auth_token") : null;
  const headers: HeadersInit = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(url, { headers }).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });
};

export function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher,
        dedupingInterval: 1000,
        refreshInterval: 5000,
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
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
