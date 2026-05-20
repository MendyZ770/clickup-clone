import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useFinanceAccounts(workspaceId?: string) {
  const { data, error, mutate } = useSWR(
    workspaceId ? `/api/finance/accounts?workspaceId=${workspaceId}` : null,
    fetcher
  );
  return { accounts: data || [], isLoading: !error && !data, error, mutate };
}

export function useFinanceCategories(workspaceId?: string, type?: string) {
  const url = workspaceId
    ? `/api/finance/categories?workspaceId=${workspaceId}${type ? `&type=${type}` : ""}`
    : null;
  const { data, error, mutate } = useSWR(url, fetcher);
  return { categories: data || [], isLoading: !error && !data, error, mutate };
}

export function useFinanceTransactions(workspaceId?: string, filters?: Record<string, string>) {
  const params = new URLSearchParams();
  if (workspaceId) params.set("workspaceId", workspaceId);
  if (filters) Object.entries(filters).forEach(([k, v]) => params.set(k, v));
  const url = workspaceId ? `/api/finance/transactions?${params.toString()}` : null;
  const { data, error, mutate } = useSWR(url, fetcher);
  return { transactions: data || [], isLoading: !error && !data, error, mutate };
}

export function useFinanceGoals(workspaceId?: string) {
  const { data, error, mutate } = useSWR(
    workspaceId ? `/api/finance/goals?workspaceId=${workspaceId}` : null,
    fetcher
  );
  return { goals: data || [], isLoading: !error && !data, error, mutate };
}

export function useFinanceStats(workspaceId?: string) {
  const { data, error } = useSWR(
    workspaceId ? `/api/finance/stats?workspaceId=${workspaceId}` : null,
    fetcher
  );
  return { stats: data, isLoading: !error && !data, error };
}
