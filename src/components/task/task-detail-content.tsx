"use client";

import { useState, useRef, useEffect } from "react";
import { useTask, useUpdateTask } from "@/hooks/use-tasks";
import { TaskProperties } from "./task-properties";
import { SubtaskList } from "./subtask-list";
import { ChecklistSection } from "./checklist";
import { CommentList } from "./comment-list";
import { ActivityFeed } from "./activity-feed";
import { TaskTimeTracking } from "@/components/time-tracking/task-time-tracking";
import { CustomFieldsSection } from "@/components/custom-fields/custom-fields-section";
import { TaskDependencies } from "./task-dependencies";
import { TaskRecurrence } from "./task-recurrence";
import { MultiAssigneeSelector } from "./multi-assignee-selector";
import { TaskAttachments } from "./task-attachments";
import { FavoriteButton } from "@/components/shared/favorite-button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Lock, Unlock, PanelRightOpen, PanelRightClose } from "lucide-react";
import { SetPinDialog } from "./set-pin-dialog";

interface TaskDetailContentProps {
  taskId: string;
  workspaceId: string;
}

export function TaskDetailContent({
  taskId,
  workspaceId,
}: TaskDetailContentProps) {
  const { task, isLoading, mutate } = useTask(taskId);
  const { updateTask } = useUpdateTask();
  const { toast } = useToast();
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const [descriptionValue, setDescriptionValue] = useState("");
  const [editingDesc, setEditingDesc] = useState(false);
  const [togglingLock, setTogglingLock] = useState(false);
  const [setPinOpen, setSetPinOpen] = useState(false);
  const [showProperties, setShowProperties] = useState(true);
  const titleRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (task) {
      setTitleValue(task.title);
      setDescriptionValue(task.description ?? "");
    }
  }, [task]);

  const handleUpdate = async (data: Record<string, unknown>) => {
    await updateTask(taskId, data as Parameters<typeof updateTask>[1]);
    mutate();
  };

  const handleTitleBlur = async () => {
    setEditingTitle(false);
    const trimmed = titleValue.trim();
    if (trimmed && trimmed !== task?.title) {
      await handleUpdate({ title: trimmed });
    }
  };

  const handleDescBlur = async () => {
    setEditingDesc(false);
    const val = descriptionValue.trim();
    if (val !== (task?.description ?? "")) {
      await handleUpdate({ description: val || null });
    }
  };

  const handleToggleLock = async () => {
    if (!task) return;
    if (!task.locked) {
      // Verrouiller → demander d'abord un PIN
      setSetPinOpen(true);
      return;
    }
    // Déverrouiller
    setTogglingLock(true);
    try {
      await updateTask(taskId, { locked: false } as Parameters<typeof updateTask>[1]);
      toast({ title: "Tâche déverrouillée", description: "Vous pouvez à nouveau la modifier." });
      mutate();
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

  const handleConfirmPin = async (pin: string) => {
    setSetPinOpen(false);
    setTogglingLock(true);
    try {
      await updateTask(taskId, { locked: true, lockedPin: pin } as Parameters<typeof updateTask>[1]);
      toast({
        title: "Tâche verrouillée",
        description: "Un code à 4 chiffres est requis pour l'ouvrir.",
      });
      mutate();
    } catch (err) {
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Impossible de verrouiller",
        variant: "destructive",
      });
    } finally {
      setTogglingLock(false);
    }
  };

  if (isLoading || !task) {
    return (
      <div className="flex flex-col md:flex-row h-full overflow-y-auto md:overflow-hidden">
        <div className="flex-1 p-4 md:p-6 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
        <div className="w-full md:w-72 border-t md:border-t-0 md:border-l p-4 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-full overflow-y-auto md:overflow-hidden">
      {/* Left: Main content */}
      <ScrollArea className="flex-1">
        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
          {task.locked && (
            <div className="flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-600 dark:text-amber-400">
              <Lock className="h-3.5 w-3.5 shrink-0" />
              <span>
                {"Cette tâche est verrouillée. Cliquez sur Déverrouiller pour la modifier ou la supprimer."}
              </span>
            </div>
          )}

          {/* Title + Favorite */}
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              {editingTitle && !task.locked ? (
                <input
                  ref={titleRef}
                  value={titleValue}
                  onChange={(e) => setTitleValue(e.target.value)}
                  onBlur={handleTitleBlur}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleTitleBlur();
                    }
                    if (e.key === "Escape") {
                      setTitleValue(task.title);
                      setEditingTitle(false);
                    }
                  }}
                  className="w-full bg-transparent text-xl md:text-2xl font-bold outline-none border-b-2 border-primary pb-1"
                  autoFocus
                />
              ) : (
                <h1
                  onClick={() => {
                    if (task.locked) return;
                    setEditingTitle(true);
                    setTimeout(() => titleRef.current?.focus(), 0);
                  }}
                  className={`text-xl md:text-2xl font-bold transition-colors inline-flex items-center gap-2 ${
                    task.locked ? "cursor-default" : "cursor-text hover:text-primary/80"
                  }`}
                >
                  {task.locked && <Lock className="h-4 w-4 text-amber-500 shrink-0" />}
                  {task.title}
                </h1>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant={task.locked ? "default" : "outline"}
                size="sm"
                onClick={handleToggleLock}
                disabled={togglingLock}
                className={`h-8 gap-1.5 ${task.locked ? "bg-amber-500 hover:bg-amber-600 text-white" : ""}`}
                aria-label={task.locked ? "Déverrouiller" : "Verrouiller"}
              >
                {task.locked ? (
                  <>
                    <Unlock className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Déverrouiller</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Verrouiller</span>
                  </>
                )}
              </Button>
              <FavoriteButton
                type="task"
                targetId={task.id}
                workspaceId={workspaceId}
                size="md"
              />
              {/* Toggle panel propriétés */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                onClick={() => setShowProperties((p) => !p)}
                aria-label={showProperties ? "Masquer les propriétés" : "Afficher les propriétés"}
                title={showProperties ? "Masquer les propriétés" : "Afficher les propriétés"}
              >
                {showProperties ? (
                  <PanelRightClose className="h-4 w-4" />
                ) : (
                  <PanelRightOpen className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Recurrence */}
          <TaskRecurrence taskId={task.id} />

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Description
            </label>
            {editingDesc ? (
              <Textarea
                ref={descRef}
                value={descriptionValue}
                onChange={(e) => setDescriptionValue(e.target.value)}
                onBlur={handleDescBlur}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setDescriptionValue(task.description ?? "");
                    setEditingDesc(false);
                  }
                }}
                className="min-h-[100px] text-sm resize-y"
                autoFocus
                placeholder="Ajouter une description..."
              />
            ) : (
              <div
                onClick={() => {
                  setEditingDesc(true);
                  setTimeout(() => descRef.current?.focus(), 0);
                }}
                className="min-h-[60px] cursor-text rounded-md border border-transparent p-2 text-sm text-muted-foreground hover:border-border transition-colors whitespace-pre-wrap"
              >
                {task.description || "Ajouter une description..."}
              </div>
            )}
          </div>

          <Separator />

          {/* Multi-Assignees */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Assignés
            </label>
            <MultiAssigneeSelector taskId={task.id} workspaceId={workspaceId} />
          </div>

          <Separator />

          {/* Custom Fields */}
          <CustomFieldsSection
            taskId={task.id}
            workspaceId={workspaceId}
          />

          <Separator />

          {/* Dependencies */}
          <TaskDependencies
            taskId={task.id}
            workspaceId={workspaceId}
            taskStatus={task.status}
          />

          <Separator />

          {/* Subtasks */}
          <SubtaskList
            taskId={task.id}
            listId={task.listId}
            subtasks={task.subtasks.map((s) => ({
              id: s.id,
              title: s.title,
              priority: s.priority,
              status: task.status, // subtask status simplified
            }))}
            onChanged={() => mutate()}
          />

          <Separator />

          {/* Checklists */}
          <ChecklistSection
            checklists={task.checklists}
            taskId={task.id}
            onChanged={() => mutate()}
          />

          <Separator />

          {/* Time Tracking */}
          <TaskTimeTracking taskId={task.id} />

          <Separator />

          {/* Attachments */}
          <TaskAttachments taskId={task.id} />

          <Separator />

          {/* Comments */}
          <CommentList taskId={task.id} />

          <Separator />

          {/* Activity */}
          <ActivityFeed taskId={task.id} />
        </div>
      </ScrollArea>

      {/* Right: Properties sidebar — masquable */}
      {showProperties && (
        <div className="w-full md:w-72 border-t md:border-t-0 md:border-l md:shrink-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              <TaskProperties
                task={task}
                workspaceId={workspaceId}
                onUpdate={handleUpdate}
                onTagsChanged={() => mutate()}
              />
            </div>
          </ScrollArea>
        </div>
      )}

      <SetPinDialog
        open={setPinOpen}
        onConfirm={handleConfirmPin}
        onCancel={() => setSetPinOpen(false)}
      />
    </div>
  );
}
