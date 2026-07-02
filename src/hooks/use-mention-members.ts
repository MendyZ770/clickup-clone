"use client";
import useSWR from "swr";

interface Member {
  id: string;
  name: string | null;
  image: string | null;
  email: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useMentionMembers(workspaceId: string | null | undefined) {
  const { data } = useSWR<Array<{ user: Member }>>(
    workspaceId ? `/api/workspaces/${workspaceId}/members` : null,
    fetcher
  );
  return data?.map((m) => m.user) ?? [];
}
