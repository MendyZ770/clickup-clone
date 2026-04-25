"use client";

import { useState, useRef, useEffect } from "react";
import { useTask, useUpdateTask } from "@/hooks/use-tasks";
import { TaskProperties } from "./task-properties";
import { SubtaskList } from "./subtask-list";
import { ChecklistSection } from "./checklist";
import { CommentList } from "./comment-list";
import { ActivityFeed } from "./activity-feed";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const [descriptionValue, setDescriptionValue] = useState("");
  const [editingDesc, setEditingDesc] = useState(false);
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

  if (isLoading || !task) {
    return (
      <div className="flex h-full">
        <div className="flex-1 p-6 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
        <div className="w-72 border-l p-4 space-y-4">
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
    <div className="flex h-full">
      {/* Left: Main content */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Title */}
          {editingTitle ? (
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
              className="w-full bg-transparent text-2xl font-bold outline-none border-b-2 border-primary pb-1"
              autoFocus
            />
          ) : (
            <h1
              onClick={() => {
                setEditingTitle(true);
                setTimeout(() => titleRef.current?.focus(), 0);
              }}
              className="text-2xl font-bold cursor-text hover:text-primary/80 transition-colors"
            >
              {task.title}
            </h1>
          )}

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
                placeholder="Add a description..."
              />
            ) : (
              <div
                onClick={() => {
                  setEditingDesc(true);
                  setTimeout(() => descRef.current?.focus(), 0);
                }}
                className="min-h-[60px] cursor-text rounded-md border border-transparent p-2 text-sm text-muted-foreground hover:border-border transition-colors whitespace-pre-wrap"
              >
                {task.description || "Add a description..."}
              </div>
            )}
          </div>

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

          {/* Comments */}
          <CommentList taskId={task.id} />

          <Separator />

          {/* Activity */}
          <ActivityFeed taskId={task.id} />
        </div>
      </ScrollArea>

      {/* Right: Properties sidebar */}
      <div className="w-72 border-l shrink-0">
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
    </div>
  );
}
