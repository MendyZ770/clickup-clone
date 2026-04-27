"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface DependencyData {
  dependencies: Array<{ id: string; type: string }>;
  dependents: Array<{ id: string; type: string }>;
}

export function useDependencyCount(taskId: string | null | undefined) {
  const { data, mutate } = useSWR<DependencyData>(
    taskId ? `/api/tasks/${taskId}/dependencies` : null,
    fetcher
  );

  const dependencyCount = data?.dependencies?.length ?? 0;
  const dependentCount = data?.dependents?.length ?? 0;

  return {
    dependencyCount,
    dependentCount,
    totalCount: dependencyCount + dependentCount,
    mutate,
  };
}
