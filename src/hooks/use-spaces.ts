"use client";

import useSWR from "swr";
import type { SpaceWithContents } from "@/types";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useSpaces(workspaceId: string | null | undefined) {
  const { data, error, isLoading, mutate } = useSWR<SpaceWithContents[]>(
    workspaceId ? `/api/spaces?workspaceId=${workspaceId}` : null,
    fetcher
  );

  return {
    spaces: data ?? [],
    isLoading,
    isError: !!error,
    mutate,
  };
}
