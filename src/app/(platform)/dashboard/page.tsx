"use client";

import useSWR from "swr";
import { useWorkspace } from "@/hooks/use-workspace";
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

  const { data, isLoading: dataLoading } = useSWR<DashboardData>(
    currentWorkspace
      ? `/api/dashboard/stats?workspaceId=${currentWorkspace.id}`
      : null,
    fetcher,
    { refreshInterval: 60000 }
  );

  const isLoading = workspaceLoading || dataLoading;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          {currentWorkspace
            ? `Overview of ${currentWorkspace.name}`
            : "Select a workspace to get started"}
        </p>
      </div>

      {/* Stats Cards */}
      <StatsCards
        totalTasks={data?.totalTasks ?? 0}
        completedTasks={data?.completedTasks ?? 0}
        overdueTasks={data?.overdueTasks ?? 0}
        tasksDueThisWeek={data?.tasksDueThisWeek ?? 0}
        isLoading={isLoading}
      />

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
