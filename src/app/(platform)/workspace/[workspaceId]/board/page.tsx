"use client";

import { useParams } from "next/navigation";
import { BoardView } from "@/components/views/board-view";
import { ViewSwitcher } from "@/components/layout/view-switcher";
import useSWR from "swr";
import type { WorkspaceWithSpaces } from "@/types";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Failed to fetch");
    return r.json();
  });

export default function WorkspaceBoardPage() {
  const params = useParams<{ workspaceId: string }>();
  
  const { data: workspace } = useSWR<WorkspaceWithSpaces>(
    `/api/workspaces/${params.workspaceId}`,
    fetcher
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex-none p-4 md:p-6 pb-2 border-b">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">{workspace?.name ?? "Chargement..."}</h1>
            {workspace?.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {workspace.description}
              </p>
            )}
          </div>
          <ViewSwitcher />
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <BoardView workspaceId={params.workspaceId} />
      </div>
    </div>
  );
}
