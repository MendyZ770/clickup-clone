import useSWR from "swr";

const fetcher = async (url: string) => {
  const r = await fetch(url);
  if (!r.ok) {
    const err = await r.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `HTTP ${r.status}`);
  }
  return r.json();
};

function ensureArray<T>(data: unknown): T[] {
  return Array.isArray(data) ? (data as T[]) : [];
}

export function useFinanceAccounts(workspaceId?: string) {
  const { data, error, mutate } = useSWR(
    workspaceId ? `/api/finance/accounts?workspaceId=${workspaceId}` : null,
    fetcher
  );
  return { accounts: ensureArray(data), isLoading: !error && !data, error, mutate };
}

export function useFinanceCategories(workspaceId?: string, type?: string) {
  const url = workspaceId
    ? `/api/finance/categories?workspaceId=${workspaceId}${type ? `&type=${type}` : ""}`
    : null;
  const { data, error, mutate } = useSWR(url, fetcher);
  return { categories: ensureArray(data), isLoading: !error && !data, error, mutate };
}

export function useFinanceTransactions(workspaceId?: string, filters?: Record<string, string>) {
  const params = new URLSearchParams();
  if (workspaceId) params.set("workspaceId", workspaceId);
  if (filters) Object.entries(filters).forEach(([k, v]) => params.set(k, v));
  const url = workspaceId ? `/api/finance/transactions?${params.toString()}` : null;
  const { data, error, mutate } = useSWR(url, fetcher);
  return { transactions: ensureArray(data), isLoading: !error && !data, error, mutate };
}

export function useFinanceGoals(workspaceId?: string) {
  const { data, error, mutate } = useSWR(
    workspaceId ? `/api/finance/goals?workspaceId=${workspaceId}` : null,
    fetcher
  );
  return { goals: ensureArray(data), isLoading: !error && !data, error, mutate };
}

export function useFinanceStats(workspaceId?: string) {
  const { data, error, mutate } = useSWR(
    workspaceId ? `/api/finance/stats?workspaceId=${workspaceId}` : null,
    fetcher
  );
  return { stats: data, isLoading: !error && !data, error, mutate };
}
