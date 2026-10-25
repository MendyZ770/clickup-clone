"use client";

import useSWR from "swr";
import { apiJson, ApiError } from "@/lib/api-client";

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
    if (!workspaceId) throw new ApiError("Espace de travail indisponible.", 0);
    await apiJson("/api/templates", {
      method: "POST",
      body: JSON.stringify({ ...template, workspaceId }),
    });
    mutate();
  };

  const deleteTemplate = async (id: string) => {
    await apiJson(`/api/templates?id=${id}`, { method: "DELETE" });
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
