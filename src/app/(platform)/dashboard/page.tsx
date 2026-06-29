"use client";

import { useMemo } from "react";
import useSWR, { useSWRConfig } from "swr";
import { LayoutDashboard, Zap, Calendar, ListTodo } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/hooks/use-workspace";
import { useBudgets } from "@/hooks/use-budgets";
import { useModal } from "@/providers/modal-provider";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { TasksByStatusChart } from "@/components/dashboard/tasks-by-status-chart";
import { TasksByPriorityChart } from "@/components/dashboard/tasks-by-priority-chart";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { UpcomingDeadlines } from "@/components/dashboard/upcoming-deadlines";
import { BudgetWidget } from "@/components/dashboard/budget-widget";
import { FinanceWidget } from "@/components/dashboard/finance-widget";
import { cn } from "@/lib/utils";

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
  recentActivities: Array<{
    id: string;
    action: string;
    field: string | null;
    oldValue: string | null;
    newValue: string | null;
    createdAt: string;
    user: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
    };
    task: { id: string; title: string };
  }>;
  upcomingDeadlines: Array<{
    id: string;
    title: string;
    priority: string;
    dueDate: string;
    status: { id: string; name: string; color: string };
    assignees: {
      user: {
        id: string;
        name: string | null;
        email: string;
        image: string | null;
      };
    }[];
    list: { id: string; name: string };
  }>;
}

export default function DashboardPage() {
  const { currentWorkspace, isLoading: workspaceLoading } = useWorkspace();
  const router = useRouter();
  const { mutate: globalMutate } = useSWRConfig();
  const { budgets: workspaceBudgets, isLoading: budgetsLoading } = useBudgets(currentWorkspace?.id);
  const { openCreateTask } = useModal();

  const { data, isLoading: dataLoading } = useSWR<DashboardData>(
    currentWorkspace
      ? `/api/dashboard/stats?workspaceId=${currentWorkspace.id}`
      : null,
    fetcher,
    {
      refreshInterval: 300000, // 5 minutes
      dedupingInterval: 10000, // 10 seconds dedupe
      keepPreviousData: true,
    }
  );

  const isLoading = workspaceLoading || dataLoading;

  const handleTaskCreated = () => {
    if (currentWorkspace) {
      globalMutate(`/api/dashboard/stats?workspaceId=${currentWorkspace.id}`);
    }
  };

  // Memoize derived data to prevent child re-renders
  const statsData = useMemo(
    () => ({
      totalTasks: data?.totalTasks ?? 0,
      completedTasks: data?.completedTasks ?? 0,
      overdueTasks: data?.overdueTasks ?? 0,
      tasksDueThisWeek: data?.tasksDueThisWeek ?? 0,
    }),
    [data?.totalTasks, data?.completedTasks, data?.overdueTasks, data?.tasksDueThisWeek]
  );

  const tasksByStatus = useMemo(
    () => (Array.isArray(data?.tasksByStatus) ? data.tasksByStatus : []),
    [data?.tasksByStatus]
  );

  const tasksByPriority = useMemo(
    () => (Array.isArray(data?.tasksByPriority) ? data.tasksByPriority : []),
    [data?.tasksByPriority]
  );

  const recentActivities = useMemo(
    () => (Array.isArray(data?.recentActivities) ? data.recentActivities : []),
    [data?.recentActivities]
  );

  const upcomingDeadlines = useMemo(
    () => (Array.isArray(data?.upcomingDeadlines) ? data.upcomingDeadlines : []),
    [data?.upcomingDeadlines]
  );

  // Productivity score
  const productivityScore = useMemo(() => {
    const total = data?.totalTasks ?? 0;
    const completed = data?.completedTasks ?? 0;
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  }, [data?.totalTasks, data?.completedTasks]);

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

      {/* Quick Actions + Productivity Score */}
      {currentWorkspace && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {/* Productivity Score Card */}
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

          {/* Quick Links */}
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

      {/* Stats Cards */}
      <StatsCards
        {...statsData}
        isLoading={isLoading}
        onCardClick={() => {
          router.push("/my-tasks");
        }}
      />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
        <TasksByStatusChart data={tasksByStatus} isLoading={isLoading} />
        <TasksByPriorityChart data={tasksByPriority} isLoading={isLoading} />
      </div>

      {/* Budget, Finance, Activity & Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
        <FinanceWidget workspaceId={currentWorkspace?.id} />
        <BudgetWidget budgets={workspaceBudgets} isLoading={budgetsLoading} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
        <RecentActivity activities={recentActivities} isLoading={isLoading} />
        <UpcomingDeadlines tasks={upcomingDeadlines} isLoading={isLoading} />
      </div>
    </div>
  );
}
