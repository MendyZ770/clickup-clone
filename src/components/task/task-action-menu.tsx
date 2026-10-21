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
  Lock,
  Unlock,
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
import { apiJson, apiErrorMessage } from "@/lib/api-client";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { SetPinDialog } from "./set-pin-dialog";
import { PinDialog } from "./pin-dialog";

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
  locked?: boolean;
  onAction?: () => void;
}

export function TaskActionMenu({ taskId, currentListId, locked = false, onAction }: TaskActionMenuProps) {
  const router = useRouter();
  const { currentWorkspace } = useWorkspace();
  const { deleteTask } = useDeleteTask();
  const { updateTask } = useUpdateTask();
  const { toast } = useToast();
  const [duplicating, setDuplicating] = useState(false);
  const [togglingLock, setTogglingLock] = useState(false);
  const [setPinOpen, setSetPinOpen] = useState(false);
  const [unlockPinOpen, setUnlockPinOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const applyLockChange = async (newLocked: boolean, pin: string) => {
    setTogglingLock(true);
    try {
      await updateTask(taskId, {
        locked: newLocked,
        lockedPin: pin,
      } as Parameters<typeof updateTask>[1]);
      toast({
        title: newLocked ? "Tâche verrouillée" : "Tâche déverrouillée",
        description: newLocked
          ? "La tâche est protégée contre les modifications et suppressions."
          : "Vous pouvez à nouveau la modifier ou la supprimer.",
      });
      onAction?.();
    } catch (err) {
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Impossible de changer l'état",
        variant: "destructive",
      });
    } finally {
      setTogglingLock(false);
    }
  };

  const handleToggleLock = () => {
    if (locked) setUnlockPinOpen(true);
    else setSetPinOpen(true);
  };

  const { data: lists } = useSWR<ListInfo[]>(
    currentWorkspace ? `/api/workspaces/${currentWorkspace.id}/lists` : null,
    fetcher
  );

  const handleDuplicate = async () => {
    setDuplicating(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/duplicate`, { method: "POST" });
      if (!res.ok) throw new Error("Duplicate failed");
      toast({ title: "Tâche dupliquée", description: "Une copie a été créée." });
      onAction?.();
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de dupliquer la tâche",
        variant: "destructive",
      });
    } finally {
      setDuplicating(false);
    }
  };

  const handleMove = async (listId: string, listName: string) => {
    try {
      await updateTask(taskId, { listId } as Parameters<typeof updateTask>[1]);
      toast({ title: "Tâche déplacée", description: `Déplacée vers ${listName}` });
      onAction?.();
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de déplacer la tâche",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTask(taskId);
      toast({ title: "Tâche supprimée" });
      onAction?.();
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la tâche",
        variant: "destructive",
      });
    } finally {
      setConfirmDelete(false);
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!currentWorkspace) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}`);
      if (!res.ok) return;
      const task = await res.json();
      await apiJson("/api/templates", {
        method: "POST",
        body: JSON.stringify({
          name: task.title,
          description: task.description,
          priority: task.priority,
          workspaceId: currentWorkspace.id,
        }),
      });
      toast({ title: "Modèle enregistré", description: `« ${task.title} » ajouté aux modèles` });
    } catch (error) {
      toast({ title: "Erreur", description: apiErrorMessage(error), variant: "destructive" });
    }
  };

  const handleOpenFullPage = () => {
    router.push(`/task/${taskId}`);
  };

  const otherLists = (lists ?? []).filter((l) => l.id !== currentListId);

  return (
    <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground opacity-60 hover:opacity-100 hover:bg-muted transition-all shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onClick={handleOpenFullPage}>
          <ExternalLink className="mr-2 h-4 w-4" />
          Ouvrir en pleine page
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleDuplicate} disabled={duplicating}>
          {duplicating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Copy className="mr-2 h-4 w-4" />
          )}
          Dupliquer
        </DropdownMenuItem>

        {otherLists.length > 0 && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger disabled={locked}>
              <ArrowRightLeft className="mr-2 h-4 w-4" />
              Déplacer vers
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="max-h-60 overflow-y-auto">
              {otherLists.map((list) => (
                <DropdownMenuItem
                  key={list.id}
                  onClick={() => handleMove(list.id, `${list.space.name} / ${list.name}`)}
                >
                  <span className="truncate">{list.space.name} / {list.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}

        <DropdownMenuItem onClick={handleSaveAsTemplate} disabled={locked}>
          <BookmarkPlus className="mr-2 h-4 w-4" />
          Enregistrer comme modèle
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleToggleLock} disabled={togglingLock}>
          {togglingLock ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : locked ? (
            <Unlock className="mr-2 h-4 w-4" />
          ) : (
            <Lock className="mr-2 h-4 w-4" />
          )}
          {locked ? "Déverrouiller" : "Verrouiller"}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setConfirmDelete(true)}
          disabled={locked}
          className="text-red-500 focus:text-red-500"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <ConfirmDialog
      open={confirmDelete}
      onOpenChange={setConfirmDelete}
      title="Supprimer la tâche"
      description="Cette action est irréversible. Les sous-tâches, commentaires et pièces jointes seront également supprimés."
      confirmLabel="Supprimer"
      onConfirm={handleDelete}
    />

    <SetPinDialog
      open={setPinOpen}
      onConfirm={(pin) => {
        setSetPinOpen(false);
        void applyLockChange(true, pin);
      }}
      onCancel={() => setSetPinOpen(false)}
    />

    <PinDialog
      open={unlockPinOpen}
      taskId={taskId}
      onSuccess={(pin) => {
        setUnlockPinOpen(false);
        void applyLockChange(false, pin);
      }}
      onCancel={() => setUnlockPinOpen(false)}
    />
    </>
  );
}
