"use client";

import useSWR from "swr";

export interface FavoriteItem {
  id: string;
  type: string;
  targetId: string;
  order: number;
  createdAt: string;
  userId: string;
  name: string;
  color?: string | null;
  icon?: string;
  workspaceId: string;
  spaceId: string;
  listId?: string;
}

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

export function useFavorites(workspaceId: string | null | undefined) {
  const { data, error, isLoading, mutate } = useSWR<FavoriteItem[]>(
    workspaceId ? `/api/favorites?workspaceId=${workspaceId}` : null,
    fetcher
  );

  const toggleFavorite = async (
    type: "task" | "list" | "space",
    targetId: string
  ) => {
    if (!workspaceId) return;

    const existing = data?.find(
      (f) => f.type === type && f.targetId === targetId
    );

    if (existing) {
      // Remove favorite
      const res = await fetch(`/api/favorites?id=${existing.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to remove favorite");
    } else {
      // Add favorite
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, targetId, workspaceId }),
      });
      if (!res.ok) throw new Error("Failed to add favorite");
    }

    mutate();
  };

  const isFavorited = (type: string, targetId: string) => {
    return data?.some((f) => f.type === type && f.targetId === targetId) ?? false;
  };

  return {
    favorites: data ?? [],
    isLoading,
    isError: !!error,
    mutate,
    toggleFavorite,
    isFavorited,
  };
}
