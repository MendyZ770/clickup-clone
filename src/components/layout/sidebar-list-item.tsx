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
        "group relative flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-sm transition-all duration-150",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
      )}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-sidebar-accent-foreground" />
      )}
      <div
        className={cn(
          "h-3 w-3 shrink-0 rounded-full transition-transform duration-150",
          isActive && "scale-125"
        )}
        style={{ backgroundColor: list.color ?? "#6B7280" }}
      />
      <span className="flex-1 truncate text-left">{list.name}</span>
      {taskCount !== undefined && taskCount > 0 && (
        <span
          className={cn(
            "shrink-0 text-[12px] transition-colors",
            isActive ? "text-sidebar-accent-foreground/70" : "text-muted-foreground/70"
          )}
        >
          {taskCount}
        </span>
      )}
    </button>
  );
}
