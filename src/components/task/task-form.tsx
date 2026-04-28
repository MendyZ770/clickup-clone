"use client";

import { useState, useRef } from "react";
import { Plus, CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useCreateTask } from "@/hooks/use-tasks";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const PRIORITIES = [
  { value: "urgent", label: "Urgent", color: "bg-red-500" },
  { value: "high", label: "Haute", color: "bg-orange-500" },
  { value: "normal", label: "Normale", color: "bg-blue-500" },
  { value: "low", label: "Basse", color: "bg-gray-400" },
] as const;

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
  const [priority, setPriority] = useState<string>("normal");
  const [dueDate, setDueDate] = useState<Date | null>(null);
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
        priority,
        dueDate: dueDate?.toISOString() ?? undefined,
      });
      setTitle("");
      setPriority("normal");
      setDueDate(null);

      onCreated?.();
      inputRef.current?.focus();
    } catch {
      // silently fail
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsActive(false);
    setTitle("");
    setPriority("normal");
    setDueDate(null);
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
        <span>Ajouter une tâche</span>
      </button>
    );
  }

  const currentPriority = PRIORITIES.find((p) => p.value === priority) ?? PRIORITIES[2];

  return (
    <div className={cn("px-1 space-y-1.5", className)}>
      <div className="flex items-center gap-1">
        <Input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nom de la tâche"
          className="h-8 text-sm flex-1"
          disabled={isSubmitting}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSubmit();
            }
            if (e.key === "Escape") {
              handleCancel();
            }
          }}
          autoFocus
        />
        <Button
          size="sm"
          className="h-8 px-3 text-xs"
          onClick={handleSubmit}
          disabled={isSubmitting || !title.trim()}
        >
          <Plus className="h-3 w-3 mr-1" />
          Créer
        </Button>
      </div>

      {/* Quick options row */}
      <div className="flex items-center gap-1 flex-wrap">
        {/* Priority picker */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground hover:bg-muted transition-colors">
              <span className={cn("h-2 w-2 rounded-full", currentPriority.color)} />
              {currentPriority.label}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-36 p-1" align="start">
            {PRIORITIES.map((p) => (
              <button
                key={p.value}
                onClick={() => setPriority(p.value)}
                className={cn(
                  "flex items-center gap-2 w-full rounded px-2 py-1.5 text-xs hover:bg-muted transition-colors",
                  priority === p.value && "bg-muted"
                )}
              >
                <span className={cn("h-2 w-2 rounded-full", p.color)} />
                {p.label}
              </button>
            ))}
          </PopoverContent>
        </Popover>

        {/* Due date picker */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground hover:bg-muted transition-colors">
              <CalendarIcon className="h-2.5 w-2.5" />
              {dueDate ? format(dueDate, "d MMM") : "Échéance"}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dueDate ?? undefined}
              onSelect={(d) => setDueDate(d ?? null)}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <button
          onClick={handleCancel}
          className="ml-auto text-[10px] text-muted-foreground hover:text-foreground transition-colors"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
