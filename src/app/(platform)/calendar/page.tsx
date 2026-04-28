"use client";

import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
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
  parseISO,
} from "date-fns";
import { fr } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWorkspace } from "@/hooks/use-workspace";
import { useModal } from "@/hooks/use-modal";
import { useCreateTask, useUpdateTask } from "@/hooks/use-tasks";
import { cn } from "@/lib/utils";

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

interface WorkspaceList {
  id: string;
  name: string;
  space: { id: string; name: string };
}

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "bg-red-500",
  high: "bg-orange-500",
  normal: "bg-blue-500",
  low: "bg-gray-400",
};

const PRIORITY_LABELS: Record<string, string> = {
  urgent: "Urgent",
  high: "Haute",
  normal: "Normale",
  low: "Basse",
};

export default function GlobalCalendarPage() {
  const { currentWorkspace } = useWorkspace();
  const { openTaskModal, setWorkspaceId } = useModal();
  const { createTask } = useCreateTask();
  const { updateTask } = useUpdateTask();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  // Create dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [createDate, setCreateDate] = useState<Date | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newListId, setNewListId] = useState<string>("");
  const [newPriority, setNewPriority] = useState<string>("normal");
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    if (currentWorkspace?.id) setWorkspaceId(currentWorkspace.id);
  }, [currentWorkspace?.id, setWorkspaceId]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  const { data: tasks, mutate } = useSWR<CalendarTask[]>(
    currentWorkspace
      ? `/api/tasks/calendar?workspaceId=${currentWorkspace.id}&start=${monthStart.toISOString()}&end=${monthEnd.toISOString()}`
      : null,
    fetcher
  );

  const { data: lists } = useSWR<WorkspaceList[]>(
    currentWorkspace ? `/api/workspaces/${currentWorkspace.id}/lists` : null,
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

  const openCreateDialog = (date: Date) => {
    setCreateDate(date);
    setNewTitle("");
    setNewPriority("normal");
    if (lists && lists.length > 0 && !newListId) {
      setNewListId(lists[0].id);
    }
    setCreateError(null);
    setCreateOpen(true);
  };

  const handleCreate = async () => {
    const trimmed = newTitle.trim();
    if (!trimmed || !newListId || !createDate || submitting) return;
    setSubmitting(true);
    setCreateError(null);
    try {
      await createTask({
        title: trimmed,
        listId: newListId,
        priority: newPriority,
        dueDate: createDate.toISOString(),
      });
      setCreateOpen(false);
      mutate();
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : "Impossible de créer la tâche"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDrop = async (dateKey: string, taskId: string) => {
    setDragOverDate(null);
    const task = tasks?.find((t) => t.id === taskId);
    if (!task) return;
    const currentKey = task.dueDate
      ? format(new Date(task.dueDate), "yyyy-MM-dd")
      : null;
    if (currentKey === dateKey) return;

    const newDate = parseISO(dateKey);
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

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarIcon className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Calendrier</h1>
              <p className="text-sm text-muted-foreground">
                {"Vue d'ensemble de toutes vos tâches avec une date limite"}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => openCreateDialog(selectedDay ?? new Date())}
            disabled={!lists || lists.length === 0}
          >
            <Plus className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Nouvelle tâche</span>
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          {/* Calendar grid */}
          <div className="flex-1 min-w-0">
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-sm md:text-lg font-semibold min-w-[140px] md:min-w-[200px] text-center capitalize">
                  {format(currentDate, "MMMM yyyy", { locale: fr })}
                </h2>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={() => { setCurrentDate(new Date()); setSelectedDay(new Date()); }}>
                {"Aujourd'hui"}
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
                        "group relative min-h-[60px] md:min-h-[90px] border-b border-r p-1 md:p-1.5 text-left transition-colors",
                        !isCurrentMonth && "bg-muted/10",
                        today && "bg-primary/5",
                        isSelected && "ring-2 ring-primary ring-inset",
                        isDragOver && "bg-primary/10"
                      )}
                    >
                      <button
                        onClick={() => setSelectedDay(day)}
                        className="absolute inset-0 w-full h-full"
                        aria-label={`Sélectionner ${format(day, "EEEE d MMMM", { locale: fr })}`}
                      />

                      <div className="relative flex items-center justify-between mb-1">
                        <span
                          className={cn(
                            "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs",
                            today && "bg-primary text-primary-foreground font-bold",
                            !isCurrentMonth && "text-muted-foreground/40"
                          )}
                        >
                          {format(day, "d")}
                        </span>
                        <div className="flex items-center gap-1">
                          {dayTasks.length > 0 && (
                            <span className="text-[10px] text-muted-foreground font-medium">
                              {dayTasks.length}
                            </span>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openCreateDialog(day);
                            }}
                            disabled={!lists || lists.length === 0}
                            className="h-5 w-5 rounded inline-flex items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-muted hover:text-foreground transition-opacity disabled:opacity-0"
                            aria-label="Ajouter une tâche"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="relative space-y-0.5 hidden md:block">
                        {dayTasks.slice(0, 3).map((task) => (
                          <button
                            key={task.id}
                            draggable
                            onDragStart={(e) => {
                              e.stopPropagation();
                              e.dataTransfer.setData("text/plain", task.id);
                              e.dataTransfer.effectAllowed = "move";
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              openTaskModal(task.id);
                            }}
                            className="flex items-center gap-1 rounded px-1 py-0.5 text-[10px] leading-tight truncate w-full text-left hover:bg-muted/50 cursor-pointer active:cursor-grabbing"
                          >
                            <span
                              className="h-1.5 w-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: task.status.color }}
                            />
                            <span className="truncate">{task.title}</span>
                          </button>
                        ))}
                        {dayTasks.length > 3 && (
                          <div className="text-[9px] text-muted-foreground pl-1">
                            +{dayTasks.length - 3} de plus
                          </div>
                        )}
                      </div>
                      {dayTasks.length > 0 && (
                        <div className="relative flex gap-0.5 md:hidden mt-0.5 justify-center flex-wrap pointer-events-none">
                          {dayTasks.slice(0, 3).map((task) => (
                            <span
                              key={task.id}
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: task.status.color }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Side panel - selected day details */}
          <div className="w-full lg:w-72 lg:shrink-0">
            <div className="lg:sticky lg:top-6 rounded-lg border p-4 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-sm capitalize">
                  {selectedDay
                    ? format(selectedDay, "EEEE d MMMM", { locale: fr })
                    : "Sélectionnez un jour"}
                </h3>
                {selectedDay && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => openCreateDialog(selectedDay)}
                    disabled={!lists || lists.length === 0}
                    aria-label="Ajouter une tâche ce jour"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>

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
                    <span className="text-[9px] text-muted-foreground">
                      {PRIORITY_LABELS[task.priority] ?? task.priority}
                    </span>
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

      {/* Create task dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nouvelle tâche</DialogTitle>
            <DialogDescription>
              {createDate && (
                <>
                  Échéance :{" "}
                  <span className="capitalize">
                    {format(createDate, "EEEE d MMMM yyyy", { locale: fr })}
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Titre</label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Nom de la tâche"
                autoFocus
                disabled={submitting}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newTitle.trim() && newListId) {
                    e.preventDefault();
                    handleCreate();
                  }
                }}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Liste</label>
              <Select value={newListId} onValueChange={setNewListId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une liste" />
                </SelectTrigger>
                <SelectContent>
                  {lists && lists.length > 0 ? (
                    Object.entries(
                      lists.reduce<Record<string, WorkspaceList[]>>(
                        (acc, list) => {
                          const key = list.space.name;
                          if (!acc[key]) acc[key] = [];
                          acc[key].push(list);
                          return acc;
                        },
                        {}
                      )
                    ).map(([spaceName, spaceLists]) => (
                      <SelectGroup key={spaceName}>
                        <SelectLabel className="text-xs">{spaceName}</SelectLabel>
                        {spaceLists.map((list) => (
                          <SelectItem key={list.id} value={list.id}>
                            {list.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))
                  ) : (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">
                      Aucune liste disponible
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Priorité</label>
              <Select value={newPriority} onValueChange={setNewPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">Haute</SelectItem>
                  <SelectItem value="normal">Normale</SelectItem>
                  <SelectItem value="low">Basse</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {createError && (
              <p className="text-xs text-red-500">{createError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
              disabled={submitting}
            >
              Annuler
            </Button>
            <Button
              onClick={handleCreate}
              disabled={submitting || !newTitle.trim() || !newListId}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
