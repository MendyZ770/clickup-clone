"use client";

import { use } from "react";
import { ViewSwitcher } from "@/components/layout/view-switcher";
import { FilterBar } from "@/components/filters/filter-bar";
import { BoardView } from "@/components/views/board-view";
import { TemplatePicker } from "@/components/task/template-picker";

interface PageProps {
  params: Promise<{
    workspaceId: string;
    spaceId: string;
    listId: string;
  }>;
}

export default function BoardPage({ params }: PageProps) {
  const { workspaceId, spaceId, listId } = use(params);
  const basePath = `/workspace/${workspaceId}/space/${spaceId}/list/${listId}/board`;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-2 px-2 md:px-4 py-2 border-b overflow-x-auto">
        <ViewSwitcher basePath={basePath} />
        <TemplatePicker workspaceId={workspaceId} listId={listId} />
      </div>
      <div className="px-2 md:px-4 py-2 border-b overflow-x-auto">
        <FilterBar listId={listId} workspaceId={workspaceId} />
      </div>
      <div className="flex-1 overflow-hidden">
        <BoardView listId={listId} workspaceId={workspaceId} />
      </div>
    </div>
  );
}
