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
  isSameDay,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWorkspace } from "@/hooks/use-workspace";
import { useModal } from "@/hooks/use-modal";
import { cn } from "@/lib/utils";
import useSWR from "swr";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Failed to fetch");
    return r.json();
  });

interface CalendarTask {
  id: string;
  title: string;
  priority: string;
  dueDate: string;
  status: { id: string; name: string; color: string };
  assignee: { id: string; name: string | null; email: string; image: string | null } | null;
  list: { id: string; name: string };
}

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "bg-red-500",
  high: "bg-orange-500",
  normal: "bg-blue-500",
  low: "bg-gray-400",
};

export default function GlobalCalendarPage() {
  const { currentWorkspace } = useWorkspace();
  const { openTaskModal, setWorkspaceId } = useModal();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  useEffect(() => {
    if (currentWorkspace?.id) setWorkspaceId(currentWorkspace.id);
  }, [currentWorkspace?.id, setWorkspaceId]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  const { data: tasks } = useSWR<CalendarTask[]>(
    currentWorkspace
      ? `/api/tasks/calendar?workspaceId=${currentWorkspace.id}&start=${monthStart.toISOString()}&end=${monthEnd.toISOString()}`
      : null,
    fetcher
  );

  const calendarDays = useMemo(() => {
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [monthStart, monthEnd]);

  const tasksByDate = useMemo(() => {
    const map = new Map<string, CalendarTask[]>();
    if (!tasks) return map;
    for (const task of tasks) {
      if (task.dueDate) {
        const dateKey = format(new Date(task.dueDate), "yyyy-MM-dd");
        const existing = map.get(dateKey) ?? [];
        existing.push(task);
        map.set(dateKey, existing);
      }
    }
    return map;
  }, [tasks]);

  const selectedDayTasks = useMemo(() => {
    if (!selectedDay) return [];
    const key = format(selectedDay, "yyyy-MM-dd");
    return tasksByDate.get(key) ?? [];
  }, [selectedDay, tasksByDate]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarIcon className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Calendrier</h1>
              <p className="text-sm text-muted-foreground">
                Vue d&apos;ensemble de toutes vos tâches avec une date limite
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Calendar grid */}
          <div className="flex-1">
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-lg font-semibold min-w-[200px] text-center">
                  {format(currentDate, "MMMM yyyy")}
                </h2>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={() => { setCurrentDate(new Date()); setSelectedDay(new Date()); }}>
                Aujourd&apos;hui
              </Button>
            </div>

            {/* Grid */}
            <div className="rounded-lg border overflow-hidden">
              {/* Weekday headers */}
              <div className="grid grid-cols-7 border-b bg-muted/30">
                {WEEKDAYS.map((day) => (
                  <div key={day} className="px-2 py-2 text-center text-xs font-medium text-muted-foreground">
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
                  const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;

                  return (
                    <button
                      key={dateKey}
                      onClick={() => setSelectedDay(day)}
                      className={cn(
                        "min-h-[90px] border-b border-r p-1.5 text-left transition-colors hover:bg-muted/30",
                        !isCurrentMonth && "bg-muted/10",
                        today && "bg-primary/5",
                        isSelected && "ring-2 ring-primary ring-inset"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={cn(
                            "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs",
                            today && "bg-primary text-primary-foreground font-bold",
                            !isCurrentMonth && "text-muted-foreground/40"
                          )}
                        >
                          {format(day, "d")}
                        </span>
                        {dayTasks.length > 0 && (
                          <span className="text-[10px] text-muted-foreground font-medium">
                            {dayTasks.length}
                          </span>
                        )}
                      </div>
                      <div className="space-y-0.5">
                        {dayTasks.slice(0, 3).map((task) => (
                          <div
                            key={task.id}
                            className="flex items-center gap-1 rounded px-1 py-0.5 text-[10px] leading-tight truncate"
                          >
                            <span
                              className="h-1.5 w-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: task.status.color }}
                            />
                            <span className="truncate">{task.title}</span>
                          </div>
                        ))}
                        {dayTasks.length > 3 && (
                          <div className="text-[9px] text-muted-foreground pl-1">
                            +{dayTasks.length - 3} de plus
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Side panel - selected day details */}
          <div className="w-72 shrink-0">
            <div className="sticky top-6 rounded-lg border p-4 space-y-4">
              <h3 className="font-semibold text-sm">
                {selectedDay ? format(selectedDay, "EEEE d MMMM") : "Sélectionnez un jour"}
              </h3>

              {selectedDay && selectedDayTasks.length === 0 && (
                <div className="text-center py-6">
                  <CalendarIcon className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Aucune tâche ce jour</p>
                </div>
              )}

              {selectedDayTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => openTaskModal(task.id)}
                  className="w-full text-left rounded-lg border p-3 space-y-2 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0 mt-1"
                      style={{ backgroundColor: task.status.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{task.title}</p>
                      <p className="text-[10px] text-muted-foreground">{task.list.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-[9px] capitalize h-4">
                      {task.status.name}
                    </Badge>
                    <div className={cn("h-1.5 w-1.5 rounded-full", PRIORITY_COLORS[task.priority])} />
                    <span className="text-[9px] text-muted-foreground capitalize">{task.priority}</span>
                    {task.dueDate && (
                      <span className="text-[9px] text-muted-foreground flex items-center gap-0.5 ml-auto">
                        <Clock className="h-2.5 w-2.5" />
                        {format(new Date(task.dueDate), "HH:mm")}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
