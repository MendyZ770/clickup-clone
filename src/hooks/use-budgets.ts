"use client";

import useSWR from "swr";
import { useCallback } from "react";
import type { BudgetWithTransactions } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useBudgets(workspaceId: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<BudgetWithTransactions[]>(
    workspaceId ? `/api/budget?workspaceId=${workspaceId}` : null,
    fetcher
  );

  return {
    budgets: data ?? [],
    isLoading,
    isError: !!error,
    mutate,
  };
}

export function useBudget(budgetId: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<BudgetWithTransactions>(
    budgetId ? `/api/budget/${budgetId}` : null,
    fetcher
  );

  return {
    budget: data ?? null,
    isLoading,
    isError: !!error,
    mutate,
  };
}

export function useCreateBudget() {
  const createBudget = useCallback(
    async (data: {
      name: string;
      description?: string;
      amount: number;
      currency?: string;
      color?: string;
      workspaceId: string;
    }) => {
      const res = await fetch("/api/budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create budget");
      }
      return res.json();
    },
    []
  );
  return { createBudget };
}

export function useUpdateBudget() {
  const updateBudget = useCallback(
    async (
      budgetId: string,
      data: {
        name?: string;
        description?: string | null;
        amount?: number;
        currency?: string;
        color?: string;
      }
    ) => {
      const res = await fetch(`/api/budget/${budgetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update budget");
      }
      return res.json();
    },
    []
  );
  return { updateBudget };
}

export function useDeleteBudget() {
  const deleteBudget = useCallback(async (budgetId: string) => {
    const res = await fetch(`/api/budget/${budgetId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to delete budget");
    }
    return res.json();
  }, []);
  return { deleteBudget };
}
