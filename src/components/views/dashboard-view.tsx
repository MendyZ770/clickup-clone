"use client";

import { useMemo, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { LayoutDashboard, CheckCircle2, AlertCircle, ListTodo } from "lucide-react";
import { useTasks } from "@/hooks/use-tasks";
import { useModal } from "@/hooks/use-modal";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { isBefore, startOfToday } from "date-fns";

interface DashboardViewProps {
  listId?: string;
  spaceId?: string;
  workspaceId: string;
}

export function DashboardView({ listId, spaceId, workspaceId }: DashboardViewProps) {
  const { setWorkspaceId } = useModal();

  useEffect(() => {
    setWorkspaceId(workspaceId);
  }, [workspaceId, setWorkspaceId]);

  // Fetch all tasks for the given scope (no filters)
  const { tasks, isLoading } = useTasks({ listId, spaceId, workspaceId }, {});

  // 1. Calculate Key Metrics
  const metrics = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.status.type === "done" || t.status.type === "closed").length;
    const today = startOfToday();
    const overdue = tasks.filter(
      (t) => t.dueDate && isBefore(new Date(t.dueDate), today) && t.status.type !== "done" && t.status.type !== "closed"
    ).length;

    return { total, done, overdue };
  }, [tasks]);

  // 2. Data for Status Pie Chart
  const statusData = useMemo(() => {
    const counts: Record<string, { name: string; value: number; color: string }> = {};
    tasks.forEach((t) => {
      const key = t.status.name;
      if (!counts[key]) {
        counts[key] = { name: key, value: 0, color: t.status.color };
      }
      counts[key].value++;
    });
    return Object.values(counts);
  }, [tasks]);

  // 3. Data for Priority Bar Chart
  const priorityData = useMemo(() => {
    const order = ["urgent", "high", "normal", "low"];
    const colors: Record<string, string> = {
      urgent: "#ef4444",
      high: "#f97316",
      normal: "#3b82f6",
      low: "#9ca3af",
    };
    const labels: Record<string, string> = {
      urgent: "Urgent",
      high: "Haute",
      normal: "Normale",
      low: "Basse",
    };

    const counts: Record<string, number> = { urgent: 0, high: 0, normal: 0, low: 0 };
    tasks.forEach((t) => {
      if (counts[t.priority] !== undefined) {
        counts[t.priority]++;
      } else {
        counts["normal"]++; // fallback
      }
    });

    return order.map((p) => ({
      name: labels[p],
      value: counts[p],
      fill: colors[p],
    }));
  }, [tasks]);

  // 4. Data for Assignees Bar Chart
  const assigneeData = useMemo(() => {
    const counts: Record<string, { name: string; value: number }> = {};
    let unassigned = 0;

    tasks.forEach((t) => {
      if (t.assignees && t.assignees.length > 0) {
        t.assignees.forEach((a) => {
          const name = a.user.name || a.user.email || "Inconnu";
          if (!counts[name]) {
            counts[name] = { name, value: 0 };
          }
          counts[name].value++;
        });
      } else {
        unassigned++;
      }
    });

    const data = Object.values(counts).sort((a, b) => b.value - a.value);
    if (unassigned > 0) {
      data.push({ name: "Non assigné", value: unassigned });
    }
    return data;
  }, [tasks]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <LayoutDashboard className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
        <h3 className="text-lg font-medium">Aucune donnée</h3>
        <p className="text-muted-foreground mt-1 max-w-sm">
          Créez des tâches pour voir apparaître vos statistiques sur le tableau de bord.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-background/40 backdrop-blur-md border border-border/40 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
            <ListTodo className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total des tâches</p>
            <h3 className="text-3xl font-bold">{metrics.total}</h3>
          </div>
        </div>
        <div className="bg-background/40 backdrop-blur-md border border-border/40 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Tâches complétées</p>
            <h3 className="text-3xl font-bold">{metrics.done}</h3>
          </div>
        </div>
        <div className="bg-background/40 backdrop-blur-md border border-border/40 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
            <AlertCircle className="h-6 w-6 text-red-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Tâches en retard</p>
            <h3 className="text-3xl font-bold">{metrics.overdue}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Chart */}
        <div className="bg-background/40 backdrop-blur-md border border-border/40 rounded-xl p-5 shadow-sm flex flex-col h-[350px]">
          <h3 className="text-base font-semibold mb-4">Répartition par Statut</h3>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "0.5rem",
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Chart */}
        <div className="bg-background/40 backdrop-blur-md border border-border/40 rounded-xl p-5 shadow-sm flex flex-col h-[350px]">
          <h3 className="text-base font-semibold mb-4">Répartition par Priorité</h3>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "0.5rem",
                  }}
                  cursor={{ fill: "hsl(var(--muted)/0.5)" }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Assignee Chart */}
        <div className="bg-background/40 backdrop-blur-md border border-border/40 rounded-xl p-5 shadow-sm flex flex-col h-[350px] lg:col-span-2">
          <h3 className="text-base font-semibold mb-4">Charge de travail (Tâches par membre)</h3>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={assigneeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "0.5rem",
                  }}
                  cursor={{ fill: "hsl(var(--muted)/0.5)" }}
                />
                <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
