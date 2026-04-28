"use client";

import { useParams } from "next/navigation";
import { ViewSwitcher } from "@/components/layout/view-switcher";
import { FilterBar } from "@/components/filters/filter-bar";
import { ListView } from "@/components/views/list-view";
import { TemplatePicker } from "@/components/task/template-picker";

export default function ListViewPage() {
  const params = useParams<{
    workspaceId: string;
    spaceId: string;
    listId: string;
  }>();
  const { workspaceId, spaceId, listId } = params;
  const basePath = `/workspace/${workspaceId}/space/${spaceId}/list/${listId}/list-view`;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-2 px-2 md:px-4 py-2 border-b overflow-x-auto">
        <ViewSwitcher basePath={basePath} />
        <TemplatePicker workspaceId={workspaceId} listId={listId} />
      </div>
      <div className="px-2 md:px-4 py-2 border-b overflow-x-auto">
        <FilterBar listId={listId} workspaceId={workspaceId} />
      </div>
      <div className="flex-1 overflow-y-auto">
        <ListView listId={listId} workspaceId={workspaceId} />
      </div>
    </div>
  );
}
