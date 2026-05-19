"use client";

import useSWR from "swr";
import type { BudgetStats } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useBudgetStats(budgetId: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<BudgetStats>(
    budgetId ? `/api/budget/stats?budgetId=${budgetId}` : null,
    fetcher
  );

  return {
    stats: data ?? null,
    isLoading,
    isError: !!error,
    mutate,
  };
}
