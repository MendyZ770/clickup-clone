"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR, { useSWRConfig } from "swr";
import { Plus, Save, Edit3, Loader2, LayoutDashboard, ListTodo, Calendar, Zap } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SortableWidget } from "@/components/dashboard/sortable-widget";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { UpcomingDeadlines } from "@/components/dashboard/upcoming-deadlines";
import { useWorkspace } from "@/hooks/use-workspace";
import { useBudgets } from "@/hooks/use-budgets";
import { useModal } from "@/providers/modal-provider";
import { cn } from "@/lib/utils";

const TasksByStatusChart = dynamic(
  () => import("@/components/dashboard/tasks-by-status-chart").then((mod) => mod.TasksByStatusChart),
  { ssr: false, loading: () => <div className="h-[300px] rounded-lg border bg-card animate-pulse" /> }
);
const TasksByPriorityChart = dynamic(
  () => import("@/components/dashboard/tasks-by-priority-chart").then((mod) => mod.TasksByPriorityChart),
  { ssr: false, loading: () => <div className="h-[300px] rounded-lg border bg-card animate-pulse" /> }
);
const BudgetWidget = dynamic(
  () => import("@/components/dashboard/budget-widget").then((mod) => mod.BudgetWidget),
  { ssr: false, loading: () => <div className="h-[300px] rounded-lg border bg-card animate-pulse" /> }
);
const FinanceWidget = dynamic(
  () => import("@/components/dashboard/finance-widget").then((mod) => mod.FinanceWidget),
  { ssr: false, loading: () => <div className="h-[300px] rounded-lg border bg-card animate-pulse" /> }
);

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Failed to fetch");
    return r.json();
  });

interface DashboardData {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  tasksDueThisWeek: number;
  tasksByStatus: { name: string; color: string; count: number }[];
  tasksByPriority: { priority: string; count: number }[];
  recentActivities: any[];
  upcomingDeadlines: any[];
}

interface Widget {
  id: string;
  type: string;
  w: number;
  h: number;
}

export default function DashboardPage() {
  const params = useParams<{ workspaceId: string }>();
  const router = useRouter();
  const { currentWorkspace, isLoading: workspaceLoading } = useWorkspace();
  const { mutate: globalMutate } = useSWRConfig();
  const { budgets: workspaceBudgets, isLoading: budgetsLoading } = useBudgets(currentWorkspace?.id);
  const { openCreateTask } = useModal();

  const [dashboardId, setDashboardId] = useState<string | null>(null);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isWidgetsLoading, setIsWidgetsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const { data, isLoading: dataLoading } = useSWR<DashboardData>(
    currentWorkspace
      ? `/api/dashboard/stats?workspaceId=${currentWorkspace.id}`
      : null,
    fetcher,
    {
      refreshInterval: 300000,
      dedupingInterval: 10000,
      keepPreviousData: true,
    }
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch(`/api/dashboards?workspaceId=${params.workspaceId}`);
        if (res.ok) {
          const apiData = await res.json();
          if (apiData && apiData.length > 0) {
            setDashboardId(apiData[0].id);
            setWidgets(apiData[0].widgets);
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsWidgetsLoading(false);
      }
    };
    if (params.workspaceId) {
      fetchDashboard();
    }
  }, [params.workspaceId]);

  const saveLayout = async (currentWidgets = widgets) => {
    if (!dashboardId) return;
    setIsSaving(true);
    try {
      await fetch(`/api/dashboards/${dashboardId}/widgets`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ layout: currentWidgets }),
      });
      setIsEditing(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const addWidget = async (type: string) => {
    if (!dashboardId) return;
    try {
      const res = await fetch(`/api/dashboards/${dashboardId}/widgets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          x: 0,
          y: 0,
          w: type === "stats-cards" ? 2 : 1,
          h: 1,
        }),
      });
      if (res.ok) {
        const newWidget = await res.json();
        setWidgets((prev) => [...prev, newWidget]);
        setIsEditing(true);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const removeWidget = async (widgetId: string) => {
    if (!dashboardId) return;
    setWidgets((prev) => prev.filter((w) => w.id !== widgetId));
    try {
      await fetch(`/api/dashboards/${dashboardId}/widgets?widgetId=${widgetId}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setWidgets((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleTaskCreated = () => {
    if (currentWorkspace) {
      globalMutate(`/api/dashboard/stats?workspaceId=${currentWorkspace.id}`);
    }
  };

  const statsData = useMemo(
    () => ({
      totalTasks: data?.totalTasks ?? 0,
      completedTasks: data?.completedTasks ?? 0,
      overdueTasks: data?.overdueTasks ?? 0,
      tasksDueThisWeek: data?.tasksDueThisWeek ?? 0,
    }),
    [data?.totalTasks, data?.completedTasks, data?.overdueTasks, data?.tasksDueThisWeek]
  );

  const productivityScore = useMemo(() => {
    const total = data?.totalTasks ?? 0;
    const completed = data?.completedTasks ?? 0;
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  }, [data?.totalTasks, data?.completedTasks]);

  const tasksByStatus = useMemo(() => (Array.isArray(data?.tasksByStatus) ? data.tasksByStatus : []), [data?.tasksByStatus]);
  const tasksByPriority = useMemo(() => (Array.isArray(data?.tasksByPriority) ? data.tasksByPriority : []), [data?.tasksByPriority]);
  const recentActivities = useMemo(() => (Array.isArray(data?.recentActivities) ? data.recentActivities : []), [data?.recentActivities]);
  const upcomingDeadlines = useMemo(() => (Array.isArray(data?.upcomingDeadlines) ? data.upcomingDeadlines : []), [data?.upcomingDeadlines]);

  const isLoading = workspaceLoading || dataLoading || isWidgetsLoading;

  const renderWidgetContent = (type: string) => {
    switch (type) {
      case "stats-cards":
      case "stat-cards":
        return (
          <StatsCards
            {...statsData}
            isLoading={isLoading}
            onCardClick={() => router.push("/my-tasks")}
          />
        );
      case "tasks-status":
      case "tasks-overview":
        return <TasksByStatusChart data={tasksByStatus} isLoading={isLoading} />;
      case "tasks-priority":
      case "workload":
        return <TasksByPriorityChart data={tasksByPriority} isLoading={isLoading} />;
      case "finance":
        return <FinanceWidget workspaceId={currentWorkspace?.id} />;
      case "budget":
        return <BudgetWidget budgets={workspaceBudgets} isLoading={budgetsLoading} />;
      case "recent-activity":
      case "activity-feed":
        return <RecentActivity activities={recentActivities} isLoading={isLoading} />;
      case "upcoming-deadlines":
        return <UpcomingDeadlines tasks={upcomingDeadlines} isLoading={isLoading} />;
      default:
        return null;
    }
  };

  if (isLoading && !currentWorkspace) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-3 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <PageHeader
        icon={LayoutDashboard}
        title="Tableau de bord"
        description={
          currentWorkspace
            ? `Vue d'ensemble de ${currentWorkspace.name}`
            : "Sélectionnez un espace de travail pour commencer"
        }
        actions={
          <div className="flex items-center gap-2">
            {currentWorkspace && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => openCreateTask(currentWorkspace.id, undefined, handleTaskCreated)}
                className="hidden sm:flex"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Nouvelle tâche
              </Button>
            )}
            {isEditing ? (
              <Button size="sm" onClick={() => saveLayout()} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Terminé
              </Button>
            ) : (
              <Button size="sm" variant="secondary" onClick={() => setIsEditing(true)}>
                <Edit3 className="mr-2 h-4 w-4" />
                Personnaliser
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="default" className="shadow-sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => addWidget("stats-cards")}>Statistiques</DropdownMenuItem>
                <DropdownMenuItem onClick={() => addWidget("tasks-status")}>Tâches par Statut</DropdownMenuItem>
                <DropdownMenuItem onClick={() => addWidget("tasks-priority")}>Tâches par Priorité</DropdownMenuItem>
                <DropdownMenuItem onClick={() => addWidget("finance")}>Finances</DropdownMenuItem>
                <DropdownMenuItem onClick={() => addWidget("budget")}>Budgets</DropdownMenuItem>
                <DropdownMenuItem onClick={() => addWidget("recent-activity")}>Activité Récente</DropdownMenuItem>
                <DropdownMenuItem onClick={() => addWidget("upcoming-deadlines")}>Prochaines échéances</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      {/* Quick Actions + Productivity Score (Always visible at top, not a widget) */}
      {currentWorkspace && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-4">
          <div className="md:col-span-1 rounded-2xl border bg-gradient-to-br from-primary/5 via-primary/2 to-transparent p-4 md:p-5 flex items-center gap-4 hover:shadow-sm transition-shadow">
            <div className="relative h-14 w-14 shrink-0">
              <svg viewBox="0 0 36 36" className="h-14 w-14 -rotate-90">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="3"
                  strokeDasharray={`${productivityScore}, 100`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold">{productivityScore}%</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold">Productivité</p>
              <p className="text-xs text-muted-foreground">
                {data?.completedTasks ?? 0} sur {data?.totalTasks ?? 0} tâches terminées
              </p>
            </div>
          </div>
          <div className="md:col-span-2 grid grid-cols-3 gap-3">
            <Link
              href="/my-tasks"
              className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-2xl border bg-card p-4",
                "hover:bg-muted/50 hover:border-primary/30 transition-all group"
              )}
            >
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ListTodo className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-xs font-medium">Mes tâches</span>
            </Link>
            <Link
              href="/calendar"
              className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-2xl border bg-card p-4",
                "hover:bg-muted/50 hover:border-primary/30 transition-all group"
              )}
            >
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Calendar className="h-5 w-5 text-amber-600" />
              </div>
              <span className="text-xs font-medium">Calendrier</span>
            </Link>
            <Link
              href="/reminders"
              className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-2xl border bg-card p-4",
                "hover:bg-muted/50 hover:border-primary/30 transition-all group"
              )}
            >
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Zap className="h-5 w-5 text-purple-600" />
              </div>
              <span className="text-xs font-medium">Rappels</span>
            </Link>
          </div>
        </div>
      )}

      {/* Dashboard Grid */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={widgets.map((w) => w.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
            {widgets.map((widget) => (
              <div
                key={widget.id}
                className={(widget.type === "stats-cards" || widget.type === "stat-cards") ? "lg:col-span-2 h-fit" : "h-[400px]"}
              >
                <SortableWidget
                  id={widget.id}
                  title=""
                  type={widget.type}
                  isEditing={isEditing}
                  onDelete={() => removeWidget(widget.id)}
                >
                  {renderWidgetContent(widget.type)}
                </SortableWidget>
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
