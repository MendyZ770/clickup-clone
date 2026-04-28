"use client";

import useSWR from "swr";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Failed to fetch");
    return r.json();
  });

export interface TaskTemplate {
  id: string;
  name: string;
  description: string | null;
  priority: string;
  checklists: unknown;
  tags: unknown;
  creatorId: string;
  workspaceId: string;
  createdAt: string;
  creator: { id: string; name: string | null; image: string | null };
}

export function useTemplates(workspaceId: string | undefined | null) {
  const { data, isLoading, mutate } = useSWR<TaskTemplate[]>(
    workspaceId ? `/api/templates?workspaceId=${workspaceId}` : null,
    fetcher
  );

  const createTemplate = async (template: {
    name: string;
    description?: string;
    priority?: string;
    checklists?: unknown;
    tags?: unknown;
  }) => {
    if (!workspaceId) return;
    await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...template, workspaceId }),
    });
    mutate();
  };

  const deleteTemplate = async (id: string) => {
    await fetch(`/api/templates?id=${id}`, { method: "DELETE" });
    mutate();
  };

  return {
    templates: data ?? [],
    isLoading,
    createTemplate,
    deleteTemplate,
    mutate,
  };
}
