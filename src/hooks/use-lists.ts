"use client";

import useSWR from "swr";
import type { ListWithStatuses } from "@/types";

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

export function useLists(params: { spaceId?: string; folderId?: string }) {
  const { spaceId, folderId } = params;

  let key: string | null = null;
  if (folderId) {
    key = `/api/lists?folderId=${folderId}`;
  } else if (spaceId) {
    key = `/api/lists?spaceId=${spaceId}`;
  }

  const { data, error, isLoading, mutate } = useSWR<
    (ListWithStatuses & { _count: { tasks: number } })[]
  >(key, fetcher);

  return {
    lists: data ?? [],
    isLoading,
    isError: !!error,
    mutate,
  };
}
