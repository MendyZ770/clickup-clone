"use client";

import { useState } from "react";
import useSWR from "swr";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { PriorityBadge } from "./priority-badge";
import { StatusBadge } from "./status-badge";
import { useModal } from "@/hooks/use-modal";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface SubtaskItem {
  id: string;
  title: string;
  priority: string;
  status: { id: string; name: string; color: string; type: string };
}

interface SubtaskListProps {
  taskId: string;
  listId: string;
  subtasks: SubtaskItem[];
  onChanged?: () => void;
}

export function SubtaskList({
  taskId,
  listId,
  subtasks: initialSubtasks,
  onChanged,
}: SubtaskListProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { openTaskModal } = useModal();

  const { data: subtasks, mutate } = useSWR<SubtaskItem[]>(
    `/api/tasks/${taskId}/subtasks`,
    fetcher,
    { fallbackData: initialSubtasks }
  );

  const items = subtasks ?? [];
  const doneCount = items.filter(
    (s) => s.status.type === "done" || s.status.type === "closed"
  ).length;
  const progress = items.length > 0 ? (doneCount / items.length) * 100 : 0;

  const handleCreate = async () => {
    const trimmed = newTitle.trim();
    if (!trimmed || isCreating) return;
    setIsCreating(true);
    try {
      await fetch(`/api/tasks/${taskId}/subtasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed, listId }),
      });
      setNewTitle("");
      mutate();
      onChanged?.();
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-1.5 text-sm font-semibold hover:text-primary transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
        Subtasks
        <span className="text-xs font-normal text-muted-foreground">
          ({doneCount}/{items.length})
        </span>
      </button>

      {!collapsed && (
        <>
          {items.length > 0 && (
            <Progress value={progress} className="h-1.5" />
          )}

          <div className="space-y-0.5">
            {items.map((sub) => {
              const isDone =
                sub.status.type === "done" || sub.status.type === "closed";
              return (
                <div
                  key={sub.id}
                  className="flex items-center gap-2 rounded px-2 py-1 hover:bg-muted/50 transition-colors"
                >
                  <Checkbox checked={isDone} className="h-3.5 w-3.5" />
                  <button
                    onClick={() => openTaskModal(sub.id)}
                    className={cn(
                      "flex-1 truncate text-left text-sm",
                      isDone && "line-through text-muted-foreground"
                    )}
                  >
                    {sub.title}
                  </button>
                  <StatusBadge status={sub.status} />
                  <PriorityBadge priority={sub.priority} />
                </div>
              );
            })}
          </div>

          {isAdding ? (
            <div className="flex gap-1 px-2">
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Subtask name..."
                className="h-7 text-xs"
                autoFocus
                disabled={isCreating}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreate();
                  }
                  if (e.key === "Escape") {
                    setIsAdding(false);
                    setNewTitle("");
                  }
                }}
                onBlur={() => {
                  if (!newTitle.trim()) {
                    setIsAdding(false);
                  }
                }}
              />
            </div>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Plus className="h-3 w-3" />
              Add subtask
            </button>
          )}
        </>
      )}
    </div>
  );
}
