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
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { UpcomingDeadlines } from "@/components/dashboard/upcoming-deadlines";
import dynamic from "next/dynamic";

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
      {/* Header - Hidden on mobile as TopBar covers it */}
      <div className="hidden md:block">
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
      </div>

      {/* Quick Actions + Productivity Score */}
      {currentWorkspace && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {/* Productivity Score Card */}
          <div className="md:col-span-1 rounded-[2rem] border border-border/30 bg-card/40 backdrop-blur-xl p-5 flex items-center gap-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="relative h-16 w-16 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 36 36" className="absolute inset-0 h-16 w-16 -rotate-90">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="hsl(var(--muted))"
                  className="opacity-30"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="3.5"
                  strokeDasharray={`${productivityScore}, 100`}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out drop-shadow-md"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-black tracking-tighter text-foreground">{productivityScore}%</span>
              </div>
            </div>
            <div>
              <p className="text-base font-bold tracking-tight">Productivité</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {data?.completedTasks ?? 0} sur {data?.totalTasks ?? 0} tâches
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-2 grid grid-cols-3 gap-2 md:gap-3">
            <Link
              href="/my-tasks"
              className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-[1.5rem] border border-border/30 bg-card/40 backdrop-blur-xl p-3 md:p-4",
                "hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group"
              )}
            >
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors shadow-inner">
                <ListTodo className="h-5 w-5 md:h-6 md:w-6 text-blue-500" />
              </div>
              <span className="text-[11px] md:text-sm font-semibold tracking-tight text-center leading-tight">Mes tâches</span>
            </Link>
            <Link
              href="/calendar"
              className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-[1.5rem] border border-border/30 bg-card/40 backdrop-blur-xl p-3 md:p-4",
                "hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group"
              )}
            >
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors shadow-inner">
                <Calendar className="h-5 w-5 md:h-6 md:w-6 text-amber-500" />
              </div>
              <span className="text-[11px] md:text-sm font-semibold tracking-tight text-center leading-tight">Calendrier</span>
            </Link>
            <Link
              href="/reminders"
              className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-[1.5rem] border border-border/30 bg-card/40 backdrop-blur-xl p-3 md:p-4",
                "hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group"
              )}
            >
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-2xl bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors shadow-inner">
                <Zap className="h-5 w-5 md:h-6 md:w-6 text-purple-500" />
              </div>
              <span className="text-[11px] md:text-sm font-semibold tracking-tight text-center leading-tight">Rappels</span>
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
