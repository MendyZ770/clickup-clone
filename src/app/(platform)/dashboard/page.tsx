"use client";

import useSWR, { useSWRConfig } from "swr";
import { LayoutDashboard } from "lucide-react";
import { useWorkspace } from "@/hooks/use-workspace";
import { PageHeader } from "@/components/shared/page-header";
import { QuickCreateTask } from "@/components/task/quick-create-task";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { TasksByStatusChart } from "@/components/dashboard/tasks-by-status-chart";
import { TasksByPriorityChart } from "@/components/dashboard/tasks-by-priority-chart";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { UpcomingDeadlines } from "@/components/dashboard/upcoming-deadlines";

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
    assignee: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
    } | null;
    list: { id: string; name: string };
  }>;
}

export default function DashboardPage() {
  const { currentWorkspace, isLoading: workspaceLoading } = useWorkspace();
  const { mutate: globalMutate } = useSWRConfig();

  const { data, isLoading: dataLoading } = useSWR<DashboardData>(
    currentWorkspace
      ? `/api/dashboard/stats?workspaceId=${currentWorkspace.id}`
      : null,
    fetcher,
    { refreshInterval: 60000 }
  );

  const isLoading = workspaceLoading || dataLoading;

  const handleTaskCreated = () => {
    if (currentWorkspace) {
      globalMutate(`/api/dashboard/stats?workspaceId=${currentWorkspace.id}`);
    }
  };

  return (
    <div className="mx-auto max-w-7xl p-3 md:p-6 space-y-3 md:space-y-6">
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
            <QuickCreateTask
              workspaceId={currentWorkspace.id}
              onCreated={handleTaskCreated}
            />
          ) : undefined
        }
      />

      {/* Stats Cards */}
      <StatsCards
        totalTasks={data?.totalTasks ?? 0}
        completedTasks={data?.completedTasks ?? 0}
        overdueTasks={data?.overdueTasks ?? 0}
        tasksDueThisWeek={data?.tasksDueThisWeek ?? 0}
        isLoading={isLoading}
      />

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-3 md:gap-6 lg:grid-cols-2">
        <TasksByStatusChart
          data={Array.isArray(data?.tasksByStatus) ? data.tasksByStatus : []}
          isLoading={isLoading}
        />
        <TasksByPriorityChart
          data={Array.isArray(data?.tasksByPriority) ? data.tasksByPriority : []}
          isLoading={isLoading}
        />
      </div>

      {/* Activity & Deadlines */}
      <div className="grid grid-cols-1 gap-3 md:gap-6 lg:grid-cols-2">
        <RecentActivity
          activities={Array.isArray(data?.recentActivities) ? data.recentActivities : []}
          isLoading={isLoading}
        />
        <UpcomingDeadlines
          tasks={Array.isArray(data?.upcomingDeadlines) ? data.upcomingDeadlines : []}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
