"use client";
import useSWR from "swr";

interface Member {
  id: string;
  name: string | null;
  image: string | null;
  email: string;
}

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Impossible de charger les membres");
    return r.json();
  });

export function useMentionMembers(workspaceId: string | null | undefined) {
  const { data } = useSWR<Array<{ user: Member }>>(
    workspaceId ? `/api/workspaces/${workspaceId}/members` : null,
    fetcher
  );
  return Array.isArray(data) ? data.map((m) => m.user) : [];
}
