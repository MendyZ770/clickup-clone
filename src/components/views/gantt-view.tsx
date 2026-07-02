"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  format,
  addDays,
  startOfWeek,
  differenceInDays,
  isToday,
  isBefore,
  startOfDay,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTasks } from "@/hooks/use-tasks";
import { useFilters } from "@/hooks/use-filters";
import { useModal } from "@/hooks/use-modal";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { cn } from "@/lib/utils";
import type { TaskSummary } from "@/types";

const DAY_WIDTH = 50;
const ROW_HEIGHT = 40;
const HEADER_HEIGHT = 60;
const TOTAL_DAYS = 60; // 2 months view

interface GanttViewProps {
  listId: string;
  workspaceId: string;
}

export function GanttView({ listId, workspaceId }: GanttViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { getFilter } = useFilters();
  const { openTaskModal, setWorkspaceId } = useModal();
  const [startDate, setStartDate] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [taskNameWidth, setTaskNameWidth] = useState(220);

  useEffect(() => { setWorkspaceId(workspaceId); }, [workspaceId, setWorkspaceId]);

  useEffect(() => {
    const update = () => setTaskNameWidth(window.innerWidth < 768 ? 140 : 220);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const { tasks, isLoading } = useTasks(
    { listId },
    {
      statusId: getFilter("statusId") ?? undefined,
      priority: getFilter("priority") ?? undefined,
      assigneeId: getFilter("assigneeId") ?? undefined,
      search: getFilter("search") ?? undefined,
    }
  );

  const days = useMemo(() => {
    return Array.from({ length: TOTAL_DAYS }, (_, i) => addDays(startDate, i));
  }, [startDate]);

  const tasksWithDates = useMemo(() => {
    return tasks.filter((t) => t.dueDate || t.startDate);
  }, [tasks]);

  const tasksWithoutDates = useMemo(() => {
    return tasks.filter((t) => !t.dueDate && !t.startDate);
  }, [tasks]);

  useEffect(() => {
    if (scrollRef.current) {
      const todayOffset = differenceInDays(new Date(), startDate);
      if (todayOffset >= 0 && todayOffset < TOTAL_DAYS) {
        scrollRef.current.scrollLeft = Math.max(0, todayOffset * DAY_WIDTH - 200);
      }
    }
  }, [startDate]);

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><LoadingSpinner size="lg" /></div>;
  }

  const getBarStyle = (task: TaskSummary) => {
    const taskStart = task.startDate ? startOfDay(new Date(task.startDate)) : startOfDay(new Date(task.createdAt));
    const due = task.dueDate ? startOfDay(new Date(task.dueDate)) : addDays(taskStart, 1);
    
    // We allow negative left if the task starts before the current visible timeline
    const left = differenceInDays(taskStart, startDate) * DAY_WIDTH;
    const duration = Math.max(1, differenceInDays(due, taskStart) + 1);
    const width = duration * DAY_WIDTH - 8;
    
    return { left, width: Math.max(DAY_WIDTH - 8, width) };
  };

  return (
    <div className="p-2 md:p-4 space-y-3">
      <div className="flex items-center gap-1 md:gap-2 flex-wrap">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setStartDate(addDays(startDate, -7))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-xs md:text-sm font-medium min-w-[140px] md:min-w-[200px] text-center">
          {format(startDate, "d MMM")} - {format(addDays(startDate, TOTAL_DAYS - 1), "d MMM yyyy")}
        </span>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setStartDate(addDays(startDate, 7))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => setStartDate(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
          Aujourd&apos;hui
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="flex">
          {/* Task names column */}
          <div className="shrink-0 border-r bg-muted/30" style={{ width: taskNameWidth }}>
            <div className="border-b px-3 flex items-center text-xs font-medium text-muted-foreground" style={{ height: HEADER_HEIGHT }}>
              Tâches ({tasksWithDates.length})
            </div>
            {tasksWithDates.map((task) => (
              <button
                key={task.id}
                onClick={() => openTaskModal(task.id)}
                className="flex items-center gap-2 w-full px-3 text-xs border-b hover:bg-muted/50 truncate transition-colors"
                style={{ height: ROW_HEIGHT }}
              >
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: task.status.color }} />
                <span className="truncate">{task.title}</span>
              </button>
            ))}
          </div>

          {/* Timeline */}
          <div className="overflow-x-auto flex-1" ref={scrollRef}>
            <div style={{ width: TOTAL_DAYS * DAY_WIDTH, minWidth: "100%" }}>
              {/* Day headers */}
              <div className="flex border-b bg-muted/30" style={{ height: HEADER_HEIGHT }}>
                {days.map((day) => (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "shrink-0 flex flex-col items-center justify-center border-r text-xs transition-colors",
                      isToday(day) && "bg-primary/20",
                      (day.getDay() === 0 || day.getDay() === 6) && !isToday(day) ? "bg-muted/50" : ""
                    )}
                    style={{ width: DAY_WIDTH }}
                  >
                    <span className="text-muted-foreground uppercase text-[10px] tracking-wider mb-1">
                      {format(day, "EEE")}
                    </span>
                    <span className={cn(
                      "font-semibold w-6 h-6 flex items-center justify-center rounded-full",
                      isToday(day) ? "bg-primary text-primary-foreground" : "text-foreground"
                    )}>
                      {format(day, "d")}
                    </span>
                  </div>
                ))}
              </div>

              {/* Task bars */}
              {tasksWithDates.map((task) => {
                const { left, width } = getBarStyle(task);
                return (
                  <div key={task.id} className="relative border-b hover:bg-muted/10 transition-colors" style={{ height: ROW_HEIGHT }}>
                    {/* Grid lines */}
                    {days.map((day) => (
                      <div
                        key={day.toISOString()}
                        className={cn(
                          "absolute top-0 bottom-0 border-r",
                          isToday(day) && "bg-primary/5",
                          (day.getDay() === 0 || day.getDay() === 6) && !isToday(day) ? "bg-muted/20" : ""
                        )}
                        style={{ left: differenceInDays(day, startDate) * DAY_WIDTH, width: DAY_WIDTH }}
                      />
                    ))}
                    {/* Bar */}
                    <div
                      className="absolute top-2 rounded-md cursor-pointer hover:brightness-110 hover:shadow-md transition-all flex items-center px-2 text-xs text-white font-medium truncate shadow-sm z-10"
                      style={{
                        left: left + 4,
                        width,
                        height: ROW_HEIGHT - 16,
                        backgroundColor: task.status.color,
                        opacity: left + width < 0 || left > TOTAL_DAYS * DAY_WIDTH ? 0 : 1, // Hide if completely out of bounds
                      }}
                      onClick={() => openTaskModal(task.id)}
                    >
                      {width > 60 && <span className="truncate drop-shadow-sm">{task.title}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tasks without dates */}
        {tasksWithoutDates.length > 0 && (
          <div className="border-t bg-muted/10 px-3 py-2">
            <p className="text-[10px] text-muted-foreground mb-1">
              Sans date ({tasksWithoutDates.length})
            </p>
            <div className="flex flex-wrap gap-1">
              {tasksWithoutDates.slice(0, 10).map((t) => (
                <button
                  key={t.id}
                  onClick={() => openTaskModal(t.id)}
                  className="text-[10px] rounded border px-1.5 py-0.5 hover:bg-muted transition-colors truncate max-w-[120px]"
                >
                  {t.title}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
