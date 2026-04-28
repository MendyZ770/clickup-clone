"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal,
  Copy,
  ArrowRightLeft,
  Trash2,
  ExternalLink,
  Loader2,
  BookmarkPlus,
} from "lucide-react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDeleteTask, useUpdateTask } from "@/hooks/use-tasks";
import { useWorkspace } from "@/hooks/use-workspace";
import { useToast } from "@/components/ui/use-toast";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Failed to fetch");
    return r.json();
  });

interface ListInfo {
  id: string;
  name: string;
  space: { id: string; name: string };
}

interface TaskActionMenuProps {
  taskId: string;
  currentListId: string;
  onAction?: () => void;
}

export function TaskActionMenu({ taskId, currentListId, onAction }: TaskActionMenuProps) {
  const router = useRouter();
  const { currentWorkspace } = useWorkspace();
  const { deleteTask } = useDeleteTask();
  const { updateTask } = useUpdateTask();
  const { toast } = useToast();
  const [duplicating, setDuplicating] = useState(false);

  const { data: lists } = useSWR<ListInfo[]>(
    currentWorkspace ? `/api/workspaces/${currentWorkspace.id}/lists` : null,
    fetcher
  );

  const handleDuplicate = async () => {
    setDuplicating(true);
    try {
      await fetch(`/api/tasks/${taskId}/duplicate`, { method: "POST" });
      onAction?.();
    } finally {
      setDuplicating(false);
    }
  };

  const handleMove = async (listId: string) => {
    await updateTask(taskId, { listId } as Parameters<typeof updateTask>[1]);
    onAction?.();
  };

  const handleDelete = async () => {
    await deleteTask(taskId);
    onAction?.();
  };

  const handleSaveAsTemplate = async () => {
    if (!currentWorkspace) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}`);
      if (!res.ok) return;
      const task = await res.json();
      await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: task.title,
          description: task.description,
          priority: task.priority,
          workspaceId: currentWorkspace.id,
        }),
      });
      toast({ title: "Template sauvegardé", description: `"${task.title}" ajouté aux templates` });
    } catch {
      toast({ title: "Erreur", description: "Impossible de sauvegarder le template", variant: "destructive" });
    }
  };

  const handleOpenFullPage = () => {
    router.push(`/task/${taskId}`);
  };

  const otherLists = (lists ?? []).filter((l) => l.id !== currentListId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onClick={handleOpenFullPage}>
          <ExternalLink className="mr-2 h-3.5 w-3.5" />
          Ouvrir en pleine page
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleDuplicate} disabled={duplicating}>
          {duplicating ? (
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Copy className="mr-2 h-3.5 w-3.5" />
          )}
          Dupliquer
        </DropdownMenuItem>

        {otherLists.length > 0 && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <ArrowRightLeft className="mr-2 h-3.5 w-3.5" />
              Déplacer vers
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="max-h-60 overflow-y-auto">
              {otherLists.map((list) => (
                <DropdownMenuItem key={list.id} onClick={() => handleMove(list.id)}>
                  <span className="truncate">{list.space.name} / {list.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}

        <DropdownMenuItem onClick={handleSaveAsTemplate}>
          <BookmarkPlus className="mr-2 h-3.5 w-3.5" />
          Sauvegarder comme template
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleDelete}
          className="text-red-500 focus:text-red-500"
        >
          <Trash2 className="mr-2 h-3.5 w-3.5" />
          Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
