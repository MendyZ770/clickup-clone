"use client";

import { useMemo } from "react";
import { format, isPast, isToday } from "date-fns";
import { ClipboardList, Calendar, AlertTriangle, CheckCircle2 } from "lucide-react";
import useSWR from "swr";
import { useWorkspace } from "@/hooks/use-workspace";
import { useModal } from "@/hooks/use-modal";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Failed to fetch");
    return r.json();
  });

interface MyTask {
  id: string;
  title: string;
  priority: string;
  dueDate: string | null;
  status: { id: string; name: string; color: string; type: string };
  list: { id: string; name: string; space: { id: string; name: string } };
  taskTags: { tag: { id: string; name: string; color: string } }[];
  _count: { subtasks: number; comments: number };
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "text-red-500",
  high: "text-orange-500",
  normal: "text-blue-500",
  low: "text-gray-400",
};

export default function MyTasksPage() {
  const { currentWorkspace } = useWorkspace();
  const { openTaskModal } = useModal();

  const { data: tasks } = useSWR<MyTask[]>(
    currentWorkspace ? `/api/my-tasks?workspaceId=${currentWorkspace.id}` : null,
    fetcher,
    { refreshInterval: 30000 }
  );

  const grouped = useMemo(() => {
    if (!tasks) return { overdue: [], today: [], upcoming: [], noDue: [], done: [] };
    const overdue: MyTask[] = [];
    const today: MyTask[] = [];
    const upcoming: MyTask[] = [];
    const noDue: MyTask[] = [];
    const done: MyTask[] = [];

    for (const task of tasks) {
      if (task.status.type === "done" || task.status.type === "closed") {
        done.push(task);
        continue;
      }
      if (!task.dueDate) {
        noDue.push(task);
        continue;
      }
      const d = new Date(task.dueDate);
      if (isToday(d)) today.push(task);
      else if (isPast(d)) overdue.push(task);
      else upcoming.push(task);
    }
    return { overdue, today, upcoming, noDue, done };
  }, [tasks]);

  const sections = [
    { key: "overdue", label: "En retard", icon: AlertTriangle, tasks: grouped.overdue, color: "text-red-500" },
    { key: "today", label: "Aujourd'hui", icon: Calendar, tasks: grouped.today, color: "text-orange-500" },
    { key: "upcoming", label: "À venir", icon: Calendar, tasks: grouped.upcoming, color: "text-blue-500" },
    { key: "noDue", label: "Sans échéance", icon: ClipboardList, tasks: grouped.noDue, color: "text-muted-foreground" },
    { key: "done", label: "Terminées", icon: CheckCircle2, tasks: grouped.done, color: "text-green-500" },
  ];

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
        <div className="flex items-center gap-3">
          <ClipboardList className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Mes tâches</h1>
            <p className="text-xs md:text-sm text-muted-foreground">
              {tasks ? `${tasks.length} tâche(s) assignée(s)` : "Chargement..."}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardContent className="pt-3 pb-3 px-4">
              <p className="text-[10px] uppercase tracking-wider text-red-500 font-medium">En retard</p>
              <p className="text-xl font-bold">{grouped.overdue.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-3 pb-3 px-4">
              <p className="text-[10px] uppercase tracking-wider text-orange-500 font-medium">Aujourd&apos;hui</p>
              <p className="text-xl font-bold">{grouped.today.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-3 pb-3 px-4">
              <p className="text-[10px] uppercase tracking-wider text-blue-500 font-medium">À venir</p>
              <p className="text-xl font-bold">{grouped.upcoming.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-3 pb-3 px-4">
              <p className="text-[10px] uppercase tracking-wider text-green-500 font-medium">Terminées</p>
              <p className="text-xl font-bold">{grouped.done.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Task sections */}
        {sections.map(({ key, label, icon: Icon, tasks: sectionTasks, color }) => {
          if (sectionTasks.length === 0) return null;
          return (
            <div key={key} className="space-y-2">
              <div className="flex items-center gap-2">
                <Icon className={cn("h-4 w-4", color)} />
                <h2 className="text-sm font-semibold">{label}</h2>
                <span className="text-xs text-muted-foreground">({sectionTasks.length})</span>
              </div>
              <div className="rounded-lg border divide-y">
                {sectionTasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => openTaskModal(task.id)}
                    className="flex items-center gap-3 w-full px-3 py-2.5 text-left hover:bg-muted/50 transition-colors"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: task.status.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm font-medium truncate", task.status.type === "done" && "line-through text-muted-foreground")}>
                        {task.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {task.list.space.name} / {task.list.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {task.taskTags.slice(0, 2).map((tt) => (
                        <span
                          key={tt.tag.id}
                          className="h-2 w-2 rounded-full hidden sm:block"
                          style={{ backgroundColor: tt.tag.color }}
                        />
                      ))}
                      <Badge
                        variant="outline"
                        className={cn("text-[9px] capitalize h-4", PRIORITY_COLORS[task.priority])}
                      >
                        {task.priority}
                      </Badge>
                      {task.dueDate && (
                        <span className="text-[10px] text-muted-foreground hidden sm:inline">
                          {format(new Date(task.dueDate), "d MMM")}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        {tasks && tasks.length === 0 && (
          <div className="text-center py-16">
            <ClipboardList className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Aucune tâche assignée</p>
          </div>
        )}
      </div>
    </div>
  );
}
