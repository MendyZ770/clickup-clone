"use client";

import useSWR from "swr";
import type { BudgetStats } from "@/types";

const fetcher = async (url: string) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error("Failed to fetch");
  return r.json();
};

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
