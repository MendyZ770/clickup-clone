"use client";

import useSWR from "swr";
import { useCallback } from "react";
import type { BudgetCategory } from "@prisma/client";

const fetcher = async (url: string) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error("Failed to fetch");
  return r.json();
};

export function useBudgetCategories(workspaceId: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<BudgetCategory[]>(
    workspaceId ? `/api/budget/categories?workspaceId=${workspaceId}` : null,
    fetcher
  );

  return {
    categories: data ?? [],
    isLoading,
    isError: !!error,
    mutate,
  };
}

export function useCreateBudgetCategory() {
  const createCategory = useCallback(
    async (data: {
      name: string;
      color?: string;
      icon?: string;
      workspaceId: string;
    }) => {
      const res = await fetch("/api/budget/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create category");
      }
      return res.json();
    },
    []
  );
  return { createCategory };
}
