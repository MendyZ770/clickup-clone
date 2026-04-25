"use client";

import { useState, useRef } from "react";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useCreateTask } from "@/hooks/use-tasks";
import { cn } from "@/lib/utils";

interface TaskFormProps {
  listId: string;
  statusId?: string;
  onCreated?: () => void;
  className?: string;
}

export function TaskForm({
  listId,
  statusId,
  onCreated,
  className,
}: TaskFormProps) {
  const [isActive, setIsActive] = useState(false);
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { createTask } = useCreateTask();

  const handleSubmit = async () => {
    const trimmed = title.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await createTask({
        title: trimmed,
        listId,
        statusId,
      });
      setTitle("");
      onCreated?.();
      inputRef.current?.focus();
    } catch {
      // Error handling could be added here
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isActive) {
    return (
      <button
        onClick={() => {
          setIsActive(true);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted/50 transition-colors",
          className
        )}
      >
        <Plus className="h-4 w-4" />
        <span>Add Task</span>
      </button>
    );
  }

  return (
    <div className={cn("px-1", className)}>
      <Input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task name"
        className="h-9 text-sm"
        disabled={isSubmitting}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleSubmit();
          }
          if (e.key === "Escape") {
            setIsActive(false);
            setTitle("");
          }
        }}
        onBlur={() => {
          if (!title.trim()) {
            setIsActive(false);
          }
        }}
        autoFocus
      />
    </div>
  );
}
