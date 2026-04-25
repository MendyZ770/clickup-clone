"use client";

import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { ListWithStatuses } from "@/types";

interface SidebarListItemProps {
  list: ListWithStatuses & { _count?: { tasks: number } };
}

export function SidebarListItem({ list }: SidebarListItemProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isActive = pathname?.includes(`/lists/${list.id}`);
  const taskCount = list._count?.tasks;

  return (
    <button
      onClick={() => router.push(`/lists/${list.id}`)}
      className={cn(
        "flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-sm transition-colors",
        isActive
          ? "bg-white/10 text-white"
          : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
      )}
    >
      <div
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: list.color ?? "#6B7280" }}
      />
      <span className="flex-1 truncate text-left">{list.name}</span>
      {taskCount !== undefined && taskCount > 0 && (
        <span className="shrink-0 text-[10px] text-gray-600">
          {taskCount}
        </span>
      )}
    </button>
  );
}
