"use client";

import { useParams } from "next/navigation";
import { BoardView } from "@/components/views/board-view";
import { ViewSwitcher } from "@/components/layout/view-switcher";
import useSWR from "swr";
import type { SpaceWithContents } from "@/types";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Failed to fetch");
    return r.json();
  });

export default function SpaceBoardPage() {
  const params = useParams<{ workspaceId: string; spaceId: string }>();
  
  const { data: space } = useSWR<SpaceWithContents>(
    `/api/spaces/${params.spaceId}`,
    fetcher
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex-none p-4 md:p-6 pb-2 border-b">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="h-6 w-6 rounded"
              style={{ backgroundColor: space?.color ?? "#6B7280" }}
            />
            <div>
              <h1 className="text-2xl font-bold">{space?.name ?? "Chargement..."}</h1>
              {space?.description && (
                <p className="text-sm text-muted-foreground">{space.description}</p>
              )}
            </div>
          </div>
          <ViewSwitcher />
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <BoardView spaceId={params.spaceId} workspaceId={params.workspaceId} />
      </div>
    </div>
  );
}
