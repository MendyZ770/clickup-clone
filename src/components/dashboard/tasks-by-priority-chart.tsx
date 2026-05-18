"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const BarChartComponent = dynamic(
  () => import("recharts").then((mod) => {
    const { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } = mod;
    return {
      default: ({ data }: { data: { name: string; count: number; fill: string }[] }) => (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} layout="vertical" barCategoryGap="20%">
            <XAxis type="number" allowDecimals={false} fontSize={11} />
            <YAxis
              type="category"
              dataKey="name"
              width={60}
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={32}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ),
    };
  }),
  { ssr: false, loading: () => <Skeleton className="h-[240px] w-full" /> }
);

interface TasksByPriorityChartProps {
  data: { priority: string; count: number }[];
  isLoading: boolean;
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "#EF4444",
  high: "#F97316",
  normal: "#3B82F6",
  low: "#6B7280",
};

const PRIORITY_LABELS: Record<string, string> = {
  urgent: "Urgent",
  high: "Haute",
  normal: "Normale",
  low: "Basse",
};

export function TasksByPriorityChart({
  data,
  isLoading,
}: TasksByPriorityChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    name: PRIORITY_LABELS[d.priority] ?? d.priority,
    fill: PRIORITY_COLORS[d.priority] ?? "#6B7280",
  }));

  if (isLoading) {
    return (
      <div className="rounded-2xl border bg-card p-5 space-y-4">
        <Skeleton className="h-5 w-32" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (chartData.every((d) => d.count === 0)) {
    return (
      <div className="rounded-2xl border bg-card p-5 flex flex-col items-center justify-center min-h-[280px]">
        <p className="text-sm text-muted-foreground">Aucune donnée</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-card p-5 hover:shadow-sm transition-shadow">
      <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
        <span className="h-2 w-2 rounded-full bg-primary" />
        Tâches par priorité
      </h3>
      <BarChartComponent data={chartData} />
    </div>
  );
}
