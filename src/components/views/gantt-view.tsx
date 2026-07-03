"use client";

import { useMemo, useState, useEffect } from "react";
import {
  addDays,
  differenceInDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  subDays,
  startOfToday,
} from "date-fns";
import { fr } from "date-fns/locale";
import { LayoutGrid, Lock } from "lucide-react";
import { useTasks } from "@/hooks/use-tasks";
import { useModal } from "@/hooks/use-modal";
import { useFilters } from "@/hooks/use-filters";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { TaskSummary } from "@/types";

interface GanttViewProps {
  listId?: string;
  spaceId?: string;
  workspaceId: string;
}

const DAY_WIDTH = 40; // width of a single day column in px
const ROW_HEIGHT = 48; // height of a task row in px

export function GanttView({ listId, spaceId, workspaceId }: GanttViewProps) {
  const { getFilter } = useFilters();
  const { setWorkspaceId, openTaskModal } = useModal();

  useEffect(() => {
    setWorkspaceId(workspaceId);
  }, [workspaceId, setWorkspaceId]);

  const { tasks, isLoading } = useTasks(
    { listId, spaceId, workspaceId },
    {
      statusId: getFilter("statusId") ?? undefined,
      priority: getFilter("priority") ?? undefined,
      assigneeId: getFilter("assigneeId") ?? undefined,
      search: getFilter("search") ?? undefined,
      sortBy: getFilter("sortBy") ?? undefined,
      sortOrder: (getFilter("sortOrder") as "asc" | "desc") ?? undefined,
    }
  );

  // Filter tasks that have at least a startDate or dueDate
  const ganttTasks = useMemo(() => {
    return tasks.filter((t) => t.startDate || t.dueDate);
  }, [tasks]);

  // Compute the total date interval to display
  const interval = useMemo(() => {
    const today = startOfToday();
    let minDate = subDays(today, 14); // default 2 weeks before
    let maxDate = addDays(today, 30); // default 1 month after

    if (ganttTasks.length > 0) {
      ganttTasks.forEach((t) => {
        const start = t.startDate ? new Date(t.startDate) : null;
        const end = t.dueDate ? new Date(t.dueDate) : null;
        if (start && start < minDate) minDate = subDays(start, 7);
        if (end && end > maxDate) maxDate = addDays(end, 14);
      });
    }

    // Align to month boundaries for cleaner headers
    minDate = startOfMonth(minDate);
    maxDate = endOfMonth(maxDate);

    const days = eachDayOfInterval({ start: minDate, end: maxDate });
    return { minDate, maxDate, days };
  }, [ganttTasks]);

  // Group days by month for the top header
  const months = useMemo(() => {
    const result: { date: Date; count: number }[] = [];
    interval.days.forEach((day) => {
      if (result.length === 0 || !isSameMonth(result[result.length - 1].date, day)) {
        result.push({ date: day, count: 1 });
      } else {
        result[result.length - 1].count++;
      }
    });
    return result;
  }, [interval.days]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (ganttTasks.length === 0) {
    return (
      <EmptyState
        icon={LayoutGrid}
        title="Aucune tâche planifiée"
        description="Ajoutez des dates de début ou d'échéance à vos tâches pour les voir apparaître sur la Timeline."
      />
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] min-h-[500px] border border-border/40 rounded-xl overflow-hidden bg-background/50 backdrop-blur-sm">
      <ScrollArea className="w-full h-full">
        <div className="flex min-w-max relative">
          {/* LEFT SIDE: Task List (Sticky) */}
          <div className="sticky left-0 z-20 w-64 md:w-80 border-r border-border/40 bg-background/95 backdrop-blur-xl shrink-0 flex flex-col shadow-[4px_0_12px_-4px_rgba(0,0,0,0.1)]">
            <div className="h-16 border-b border-border/40 flex items-center px-4 shrink-0 font-medium text-sm text-muted-foreground bg-muted/20">
              Tâches
            </div>
            <div className="flex-1 flex flex-col">
              {ganttTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center px-4 border-b border-border/20 text-sm hover:bg-muted/30 transition-colors cursor-pointer group"
                  style={{ height: ROW_HEIGHT }}
                  onClick={() => openTaskModal(task.id, task.locked)}
                >
                  <div className="flex-1 truncate inline-flex items-center gap-2">
                    {task.locked && <Lock className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: task.status.color }}
                    />
                    <span className="truncate group-hover:text-primary transition-colors">
                      {task.title}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT SIDE: Gantt Grid */}
          <div className="flex-1 flex flex-col relative">
            {/* Header: Months */}
            <div className="flex h-8 border-b border-border/40 shrink-0 bg-muted/10">
              {months.map((m, i) => (
                <div
                  key={i}
                  className="flex items-center px-3 text-xs font-semibold uppercase text-muted-foreground border-r border-border/30 last:border-r-0 sticky left-0"
                  style={{ width: m.count * DAY_WIDTH }}
                >
                  <span className="sticky left-0">{format(m.date, "MMMM yyyy", { locale: fr })}</span>
                </div>
              ))}
            </div>

            {/* Header: Days */}
            <div className="flex h-8 border-b border-border/40 shrink-0 bg-muted/5">
              {interval.days.map((day, i) => {
                const isToday = isSameDay(day, new Date());
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                return (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center justify-center text-xs border-r border-border/30 shrink-0",
                      isToday ? "bg-primary/10 text-primary font-bold" : "",
                      isWeekend && !isToday ? "bg-muted/10" : ""
                    )}
                    style={{ width: DAY_WIDTH }}
                  >
                    {format(day, "d")}
                  </div>
                );
              })}
            </div>

            {/* Body: Grid and Bars */}
            <div className="relative flex-1" style={{ minHeight: ganttTasks.length * ROW_HEIGHT }}>
              {/* Background vertical grid lines */}
              <div className="absolute inset-0 flex pointer-events-none">
                {interval.days.map((day, i) => {
                  const isToday = isSameDay(day, new Date());
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                  return (
                    <div
                      key={i}
                      className={cn(
                        "h-full border-r border-border/20 shrink-0",
                        isToday ? "bg-primary/5 border-primary/20" : "",
                        isWeekend && !isToday ? "bg-muted/5" : ""
                      )}
                      style={{ width: DAY_WIDTH }}
                    />
                  );
                })}
              </div>

              {/* Task Rows & Bars */}
              {ganttTasks.map((task, i) => {
                const start = task.startDate ? new Date(task.startDate) : new Date(task.dueDate!);
                const end = task.dueDate ? new Date(task.dueDate) : new Date(task.startDate!);
                
                // Avoid rendering if totally out of bounds (shouldn't happen because of interval calc)
                if (start > interval.maxDate || end < interval.minDate) return null;

                const leftOffset = differenceInDays(start, interval.minDate) * DAY_WIDTH;
                const duration = Math.max(1, differenceInDays(end, start) + 1); // at least 1 day
                const width = duration * DAY_WIDTH;

                return (
                  <div
                    key={task.id}
                    className="absolute border-b border-border/10 w-full hover:bg-muted/10 transition-colors"
                    style={{
                      top: i * ROW_HEIGHT,
                      height: ROW_HEIGHT,
                    }}
                  >
                    {/* The Gantt Bar */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 h-8 rounded-md shadow-sm border border-white/10 overflow-hidden flex items-center px-2 cursor-pointer group/bar transition-all hover:scale-[1.02] hover:shadow-md hover:z-10"
                      style={{
                        left: leftOffset,
                        width: width,
                        backgroundColor: task.status.color, // Using status color for the bar
                      }}
                      onClick={() => openTaskModal(task.id, task.locked)}
                    >
                      <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
                      <span className="relative text-xs font-semibold text-white truncate drop-shadow-md px-1">
                        {task.title}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <ScrollBar orientation="horizontal" />
        <ScrollBar orientation="vertical" />
      </ScrollArea>
    </div>
  );
}
