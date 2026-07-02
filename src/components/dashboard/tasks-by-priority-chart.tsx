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
      <div className="rounded-[2rem] border border-border/30 bg-card/40 backdrop-blur-xl p-6 space-y-4 shadow-sm h-full flex flex-col">
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
      <div className="rounded-[2rem] border border-border/30 bg-card/40 backdrop-blur-xl p-6 flex flex-col items-center justify-center h-full shadow-sm">
        <p className="text-sm text-muted-foreground font-medium">Aucune tâche</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-border/30 bg-card/40 backdrop-blur-xl p-6 shadow-xl shadow-black/5 hover:shadow-2xl transition-all duration-500 group h-full flex flex-col">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <h3 className="text-sm font-semibold flex items-center gap-2 mb-4 relative z-10">
        <span className="h-2 w-2 rounded-full bg-primary" />
        Tâches par priorité
      </h3>
      <div className="flex-grow min-h-0 relative z-10 flex items-center justify-center">
        <div className="w-full h-full -ml-4">
          <BarChartComponent data={chartData} />
        </div>
      </div>
    </div>
  );
}
