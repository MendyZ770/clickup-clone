"use client";

import { motion } from "framer-motion";
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
    <motion.button
      onClick={() => router.push(listPath)}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "group relative flex w-full items-center gap-2 rounded-lg px-2 py-1 text-[13px] transition-all duration-200 outline-none ring-primary focus-visible:ring-2",
        isActive
          ? "bg-primary/10 text-primary font-medium shadow-sm"
          : "text-sidebar-foreground/70 hover:bg-primary/5 hover:text-primary"
      )}
    >
      {isActive && (
        <motion.span
          layoutId="active-indicator"
          className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary"
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        />
      )}
      <motion.div
        animate={isActive ? { scale: 1.25 } : { scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: list.color ?? "#6B7280" }}
      />
      <span className="flex-1 truncate text-left">{list.name}</span>
      {taskCount !== undefined && taskCount > 0 && (
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            "shrink-0 text-sm transition-colors",
            isActive ? "text-sidebar-accent-foreground/70" : "text-muted-foreground/70"
          )}
        >
          {taskCount}
        </motion.span>
      )}
    </motion.button>
  );
}
