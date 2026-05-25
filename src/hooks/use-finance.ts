import useSWR from "swr";
import type {
  FinanceAccount,
  FinanceCategory,
  FinanceTransaction,
  FinanceGoal,
} from "@prisma/client";

export type FinanceTransactionWithCategory = FinanceTransaction & {
  category?: FinanceCategory | null;
  account?: { id: string; name: string; currency: string } | null;
};

export type FinanceGoalWithAccount = FinanceGoal & {
  account?: { name: string } | null;
};

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
  const { data, error, mutate } = useSWR<FinanceAccount[]>(
    workspaceId ? `/api/finance/accounts?workspaceId=${workspaceId}` : null,
    fetcher
  );
  return { accounts: ensureArray<FinanceAccount>(data), isLoading: !error && !data, error, mutate };
}

export function useFinanceCategories(workspaceId?: string, type?: string) {
  const url = workspaceId
    ? `/api/finance/categories?workspaceId=${workspaceId}${type ? `&type=${type}` : ""}`
    : null;
  const { data, error, mutate } = useSWR<FinanceCategory[]>(url, fetcher);
  return { categories: ensureArray<FinanceCategory>(data), isLoading: !error && !data, error, mutate };
}

export function useFinanceTransactions(workspaceId?: string, filters?: Record<string, string>) {
  const params = new URLSearchParams();
  if (workspaceId) params.set("workspaceId", workspaceId);
  if (filters) Object.entries(filters).forEach(([k, v]) => params.set(k, v));
  const url = workspaceId ? `/api/finance/transactions?${params.toString()}` : null;
  const { data, error, mutate } = useSWR<FinanceTransactionWithCategory[]>(url, fetcher);
  return { transactions: ensureArray<FinanceTransactionWithCategory>(data), isLoading: !error && !data, error, mutate };
}

export function useFinanceGoals(workspaceId?: string) {
  const { data, error, mutate } = useSWR<FinanceGoalWithAccount[]>(
    workspaceId ? `/api/finance/goals?workspaceId=${workspaceId}` : null,
    fetcher
  );
  return { goals: ensureArray<FinanceGoalWithAccount>(data), isLoading: !error && !data, error, mutate };
}

export interface FinanceStats {
  totalBalance: number;
  accountsCount: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlyNet: number;
  categoryBreakdown: Array<{
    categoryId: string | null;
    amount: number;
    category: FinanceCategory | null;
  }>;
  goalsCount: number;
  totalTarget: number;
  totalSaved: number;
  goalsProgress: number;
}

export function useFinanceStats(workspaceId?: string) {
  const { data, error, mutate } = useSWR<FinanceStats>(
    workspaceId ? `/api/finance/stats?workspaceId=${workspaceId}` : null,
    fetcher
  );
  return { stats: data, isLoading: !error && !data, error, mutate };
}
