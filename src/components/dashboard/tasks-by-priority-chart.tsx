"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const BarChartComponent = dynamic(
  () => import("recharts").then((mod) => {
    const { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } = mod;
    return {
      default: ({ data }: { data: { name: string; count: number; fill: string }[] }) => (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical" barCategoryGap="20%">
            <XAxis type="number" allowDecimals={false} fontSize={12} />
            <YAxis
              type="category"
              dataKey="name"
              width={70}
              fontSize={12}
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
  { ssr: false, loading: () => <Skeleton className="h-[300px] w-full" /> }
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
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            Tâches par priorité
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pb-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (chartData.every((d) => d.count === 0)) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            Tâches par priorité
          </CardTitle>
        </CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center">
          <p className="text-sm text-muted-foreground">No task data yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          Tasks by Priority
        </CardTitle>
      </CardHeader>
      <CardContent>
        <BarChartComponent data={chartData} />
      </CardContent>
    </Card>
  );
}
