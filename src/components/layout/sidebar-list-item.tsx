"use client";

import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { ListWithStatuses } from "@/types";

interface SidebarListItemProps {
  list: ListWithStatuses & { _count?: { tasks: number } };
  workspaceId: string;
  spaceId: string;
}

export function SidebarListItem({ list, workspaceId, spaceId }: SidebarListItemProps) {
  const router = useRouter();
  const pathname = usePathname();
  const listPath = `/workspace/${workspaceId}/space/${spaceId}/list/${list.id}/list-view`;
  const isActive = pathname?.includes(`/list/${list.id}`);
  const taskCount = list._count?.tasks;

  return (
    <button
      onClick={() => router.push(listPath)}
      className={cn(
        "flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-sm transition-colors",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
      )}
    >
      <div
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: list.color ?? "#6B7280" }}
      />
      <span className="flex-1 truncate text-left">{list.name}</span>
      {taskCount !== undefined && taskCount > 0 && (
        <span className="shrink-0 text-[10px] text-muted-foreground/70">
          {taskCount}
        </span>
      )}
    </button>
  );
}
