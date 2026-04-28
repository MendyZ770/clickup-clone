"use client";

import { useState, useEffect, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  parseISO,
} from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTasks, useCreateTask, useUpdateTask } from "@/hooks/use-tasks";
import { useFilters } from "@/hooks/use-filters";
import { useModal } from "@/hooks/use-modal";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { cn } from "@/lib/utils";
import type { TaskSummary } from "@/types";

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

interface CalendarViewProps {
  listId: string;
  workspaceId: string;
}

export function CalendarView({ listId, workspaceId }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { getFilter } = useFilters();
  const { openTaskModal, setWorkspaceId } = useModal();
  const { createTask } = useCreateTask();
  const { updateTask } = useUpdateTask();

  const [addingForDate, setAddingForDate] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  useEffect(() => {
    setWorkspaceId(workspaceId);
  }, [workspaceId, setWorkspaceId]);

  const { tasks, isLoading, mutate } = useTasks(listId, {
    statusId: getFilter("statusId") ?? undefined,
    priority: getFilter("priority") ?? undefined,
    assigneeId: getFilter("assigneeId") ?? undefined,
    search: getFilter("search") ?? undefined,
  });

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentDate]);

  const tasksByDate = useMemo(() => {
    const map = new Map<string, TaskSummary[]>();
    tasks.forEach((task) => {
      if (task.dueDate) {
        const dateKey = format(new Date(task.dueDate), "yyyy-MM-dd");
        const existing = map.get(dateKey) ?? [];
        existing.push(task);
        map.set(dateKey, existing);
      }
    });
    return map;
  }, [tasks]);

  const handleQuickCreate = async (dateKey: string) => {
    const trimmed = newTaskTitle.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      const date = parseISO(dateKey);
      await createTask({
        title: trimmed,
        listId,
        dueDate: date.toISOString(),
      });
      setNewTaskTitle("");
      setAddingForDate(null);
      mutate();
    } catch {
      // silently fail
    } finally {
      setSubmitting(false);
    }
  };

  const handleDrop = async (dateKey: string, taskId: string) => {
    setDragOverDate(null);
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const currentDateKey = task.dueDate
      ? format(new Date(task.dueDate), "yyyy-MM-dd")
      : null;
    if (currentDateKey === dateKey) return;

    const newDate = parseISO(dateKey);
    // Preserve time-of-day if present
    if (task.dueDate) {
      const prev = new Date(task.dueDate);
      newDate.setHours(prev.getHours(), prev.getMinutes(), prev.getSeconds());
    }

    try {
      await updateTask(taskId, { dueDate: newDate.toISOString() });
      mutate();
    } catch {
      // silently fail
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const undatedCount = tasks.filter((t) => !t.dueDate).length;

  return (
    <div className="p-4 space-y-4">
      {/* Navigation header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-sm md:text-lg font-semibold min-w-[140px] md:min-w-[180px] text-center capitalize">
            {format(currentDate, "MMMM yyyy", { locale: fr })}
          </h2>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
          {"Aujourd'hui"}
        </Button>
      </div>

      {/* Calendar grid */}
      <div className="rounded-lg border overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b bg-muted/30">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="px-2 py-2 text-center text-xs font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const dayTasks = tasksByDate.get(dateKey) ?? [];
            const isCurrentMonth = isSameMonth(day, currentDate);
            const today = isToday(day);
            const isDragOver = dragOverDate === dateKey;

            return (
              <div
                key={dateKey}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  if (dragOverDate !== dateKey) setDragOverDate(dateKey);
                }}
                onDragLeave={() => {
                  if (dragOverDate === dateKey) setDragOverDate(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const taskId = e.dataTransfer.getData("text/plain");
                  if (taskId) handleDrop(dateKey, taskId);
                }}
                className={cn(
                  "group relative min-h-[70px] md:min-h-[110px] border-b border-r p-1 md:p-1.5 transition-colors",
                  !isCurrentMonth && "bg-muted/20",
                  today && "bg-primary/5",
                  isDragOver && "bg-primary/10 ring-2 ring-primary ring-inset"
                )}
              >
                {/* Day number */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={cn(
                      "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs",
                      today &&
                        "bg-primary text-primary-foreground font-bold",
                      !isCurrentMonth && "text-muted-foreground/50"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  <div className="flex items-center gap-1">
                    {dayTasks.length > 3 && (
                      <span className="text-[10px] text-muted-foreground">
                        +{dayTasks.length - 3}
                      </span>
                    )}
                    {/* Quick-add button */}
                    <Popover
                      open={addingForDate === dateKey}
                      onOpenChange={(open) => {
                        if (open) {
                          setAddingForDate(dateKey);
                          setNewTaskTitle("");
                        } else {
                          setAddingForDate(null);
                        }
                      }}
                    >
                      <PopoverTrigger asChild>
                        <button
                          className="h-5 w-5 rounded inline-flex items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-muted hover:text-foreground transition-opacity"
                          aria-label="Ajouter une tâche"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-2" align="end">
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground px-1">
                            {format(day, "EEEE d MMMM", { locale: fr })}
                          </p>
                          <Input
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            placeholder="Nom de la tâche"
                            className="h-8 text-sm"
                            autoFocus
                            disabled={submitting}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleQuickCreate(dateKey);
                              }
                              if (e.key === "Escape") {
                                setAddingForDate(null);
                              }
                            }}
                          />
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs"
                              onClick={() => setAddingForDate(null)}
                              disabled={submitting}
                            >
                              Annuler
                            </Button>
                            <Button
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => handleQuickCreate(dateKey)}
                              disabled={submitting || !newTaskTitle.trim()}
                            >
                              {submitting && (
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                              )}
                              Créer
                            </Button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Tasks */}
                <div className="space-y-0.5">
                  {dayTasks.slice(0, 3).map((task) => (
                    <button
                      key={task.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", task.id);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onClick={() => openTaskModal(task.id)}
                      className="flex w-full items-center gap-1 rounded px-1 py-0.5 text-[10px] leading-tight hover:bg-muted transition-colors truncate cursor-pointer active:cursor-grabbing"
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: task.status.color }}
                      />
                      <span className="truncate">{task.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tasks without due date info */}
      {undatedCount > 0 && (
        <div className="text-xs text-muted-foreground text-center">
          {undatedCount} tâche{undatedCount > 1 ? "s" : ""} sans échéance non
          affichée{undatedCount > 1 ? "s" : ""} dans le calendrier
        </div>
      )}
    </div>
  );
}
