"use client";

import { useMemo, useState } from "react";
import { format, isPast, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import { ClipboardList, Calendar, AlertTriangle, CheckCircle2, Plus } from "lucide-react";
import useSWR, { useSWRConfig } from "swr";
import { useWorkspace } from "@/hooks/use-workspace";
import { useModal } from "@/hooks/use-modal";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useUpdateTask } from "@/hooks/use-tasks";
import { StatusBadge } from "@/components/task/status-badge";
import { cn } from "@/lib/utils";

const PRIORITY_LABELS: Record<string, string> = {
  urgent: "Urgent",
  high: "Haute",
  normal: "Normale",
  low: "Basse",
};

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
  status: { id: string; name: string; color: string; type: string } | null;
  list: { id: string; name: string; space: { id: string; name: string } | null } | null;
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
  const { openTaskModal, openCreateTask } = useModal();
  const { mutate: globalMutate } = useSWRConfig();
  const { updateTask } = useUpdateTask();

  const [mode, setMode] = useState<"me" | "team">("me");

  const { data: tasks, isLoading } = useSWR<MyTask[]>(
    currentWorkspace ? `/api/my-tasks?workspaceId=${currentWorkspace.id}&mode=${mode}` : null,
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
      const statusType = task.status?.type;
      if (statusType === "done" || statusType === "closed") {
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

  const handleTaskCreated = () => {
    if (currentWorkspace) {
      globalMutate(`/api/my-tasks?workspaceId=${currentWorkspace.id}`);
      globalMutate(`/api/my-tasks?workspaceId=${currentWorkspace.id}&mode=${mode}`);
    }
  };

  if (isLoading || !tasks) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="mx-auto max-w-5xl p-4 md:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <PageHeader
            icon={ClipboardList}
            title={mode === "me" ? "Mes tâches" : "Tâches de l'équipe"}
            description={mode === "me" ? "Tâches qui vous sont assignées" : "Tâches assignées aux autres membres"}
          />
          <Tabs value={mode} onValueChange={(val) => setMode(val as "me" | "team")} className="w-full sm:w-auto">
            <TabsList className="w-full sm:w-auto grid grid-cols-2">
              <TabsTrigger value="me">Mes tâches</TabsTrigger>
              <TabsTrigger value="team">Équipe</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="border-border/50">
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-8 w-8" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <div className="rounded-lg border divide-y space-y-0">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="flex items-center gap-3 px-3 py-2.5">
                      <Skeleton className="h-2.5 w-2.5 rounded-full" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-3/4" />
                        <Skeleton className="h-2.5 w-1/3" />
                      </div>
                      <Skeleton className="h-4 w-12" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const sections = [
    { key: "overdue", label: "En retard", icon: AlertTriangle, tasks: grouped.overdue, color: "text-red-500" },
    { key: "today", label: "Aujourd'hui", icon: Calendar, tasks: grouped.today, color: "text-orange-500" },
    { key: "upcoming", label: "À venir", icon: Calendar, tasks: grouped.upcoming, color: "text-blue-500" },
    { key: "noDue", label: "Sans échéance", icon: ClipboardList, tasks: grouped.noDue, color: "text-muted-foreground" },
    { key: "done", label: "Terminées", icon: CheckCircle2, tasks: grouped.done, color: "text-green-500" },
  ];

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl p-4 md:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <PageHeader
            icon={ClipboardList}
            title={mode === "me" ? "Mes tâches" : "Tâches de l'équipe"}
            description={mode === "me" ? "Tâches qui vous sont assignées" : "Tâches assignées aux autres membres"}
            actions={
              currentWorkspace ? (
                <Button
                  size="sm"
                  onClick={() => openCreateTask(currentWorkspace.id, undefined, handleTaskCreated)}
                >
                  <Plus className="h-5 w-5 mr-1.5" />
                  Nouvelle tâche
                </Button>
              ) : undefined
            }
          />
          <Tabs value={mode} onValueChange={(val) => setMode(val as "me" | "team")} className="w-full sm:w-auto">
            <TabsList className="w-full sm:w-auto grid grid-cols-2">
              <TabsTrigger value="me">Mes tâches</TabsTrigger>
              <TabsTrigger value="team">Équipe</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="border-border/30 bg-card/40 backdrop-blur-xl shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-red-500/5 transition-all">
            <CardContent className="p-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><AlertTriangle className="h-10 w-10 text-red-500" /></div>
              <p className="text-[10px] uppercase tracking-wider text-red-500 font-bold">En retard</p>
              <p className="text-3xl font-black mt-2">{grouped.overdue.length}</p>
            </CardContent>
          </Card>
          <Card className="border-border/30 bg-card/40 backdrop-blur-xl shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-orange-500/5 transition-all">
            <CardContent className="p-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><Calendar className="h-10 w-10 text-orange-500" /></div>
              <p className="text-[10px] uppercase tracking-wider text-orange-500 font-bold">{"Aujourd'hui"}</p>
              <p className="text-3xl font-black mt-2">{grouped.today.length}</p>
            </CardContent>
          </Card>
          <Card className="border-border/30 bg-card/40 backdrop-blur-xl shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-blue-500/5 transition-all">
            <CardContent className="p-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><Calendar className="h-10 w-10 text-blue-500" /></div>
              <p className="text-[10px] uppercase tracking-wider text-blue-500 font-bold">À venir</p>
              <p className="text-3xl font-black mt-2">{grouped.upcoming.length}</p>
            </CardContent>
          </Card>
          <Card className="border-border/30 bg-card/40 backdrop-blur-xl shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-green-500/5 transition-all">
            <CardContent className="p-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><CheckCircle2 className="h-10 w-10 text-green-500" /></div>
              <p className="text-[10px] uppercase tracking-wider text-green-500 font-bold">Terminées</p>
              <p className="text-3xl font-black mt-2">{grouped.done.length}</p>
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
                  <div
                    key={task.id}
                    className="flex items-center gap-3 w-full px-3 py-2.5 text-left hover:bg-muted/50 transition-colors group"
                  >
                    {task.status && task.list ? (
                      <StatusBadge
                        status={task.status}
                        listId={task.list.id}
                        onChange={async (statusId) => {
                          await updateTask(task.id, { statusId });
                          globalMutate(`/api/my-tasks?workspaceId=${currentWorkspace?.id}&mode=${mode}`);
                        }}
                      />
                    ) : (
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: task.status?.color ?? "#6B7280" }}
                      />
                    )}
                    <button
                      onClick={() => openTaskModal(task.id, false)}
                      className="flex-1 min-w-0 text-left"
                    >
                      <p
                        className={cn(
                          "text-sm font-medium truncate",
                          task.status?.type === "done" && "line-through text-muted-foreground"
                        )}
                      >
                        {task.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {task.list?.space?.name ?? "—"} / {task.list?.name ?? "—"}
                      </p>
                    </button>
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
                        className={cn("text-[9px] h-4", PRIORITY_COLORS[task.priority])}
                      >
                        {PRIORITY_LABELS[task.priority] ?? task.priority}
                      </Badge>
                      {task.dueDate && (
                        <span className="text-[10px] text-muted-foreground hidden sm:inline">
                          {format(new Date(task.dueDate), "d MMM", { locale: fr })}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {tasks && tasks.length === 0 && (
          <EmptyState
            icon={ClipboardList}
            title="Aucune tâche assignée"
            description="Les tâches qui vous sont assignées apparaîtront ici."
          />
        )}
      </div>
    </div>
  );
}
