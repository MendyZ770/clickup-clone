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
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTasks } from "@/hooks/use-tasks";
import { useFilters } from "@/hooks/use-filters";
import { useModal } from "@/hooks/use-modal";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { cn } from "@/lib/utils";
import type { TaskSummary } from "@/types";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface CalendarViewProps {
  listId: string;
  workspaceId: string;
}

export function CalendarView({ listId, workspaceId }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { getFilter } = useFilters();
  const { openTaskModal, setWorkspaceId } = useModal();

  useEffect(() => {
    setWorkspaceId(workspaceId);
  }, [workspaceId, setWorkspaceId]);

  const { tasks, isLoading } = useTasks(listId, {
    statusId: getFilter("statusId") ?? undefined,
    priority: getFilter("priority") ?? undefined,
    assigneeId: getFilter("assigneeId") ?? undefined,
    search: getFilter("search") ?? undefined,
  });

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentDate]);

  // Group tasks by date
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

  const goToPrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Navigation header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToPrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-sm md:text-lg font-semibold min-w-[140px] md:min-w-[180px] text-center">
            {format(currentDate, "MMMM yyyy")}
          </h2>
          <Button variant="outline" size="sm" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={goToToday}>
          Today
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

            return (
              <div
                key={dateKey}
                className={cn(
                  "min-h-[60px] md:min-h-[100px] border-b border-r p-1 md:p-1.5 transition-colors",
                  !isCurrentMonth && "bg-muted/20",
                  today && "bg-primary/5"
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
                  {dayTasks.length > 3 && (
                    <span className="text-[10px] text-muted-foreground">
                      +{dayTasks.length - 3}
                    </span>
                  )}
                </div>

                {/* Tasks */}
                <div className="space-y-0.5">
                  {dayTasks.slice(0, 3).map((task) => (
                    <button
                      key={task.id}
                      onClick={() => openTaskModal(task.id)}
                      className="flex w-full items-center gap-1 rounded px-1 py-0.5 text-[10px] leading-tight hover:bg-muted transition-colors truncate"
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
      {tasks.filter((t) => !t.dueDate).length > 0 && (
        <div className="text-xs text-muted-foreground text-center">
          {tasks.filter((t) => !t.dueDate).length} task(s) without a due date
          are not shown on the calendar
        </div>
      )}
    </div>
  );
}
