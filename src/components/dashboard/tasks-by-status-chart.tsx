"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const RechartsComponents = dynamic(
  () => import("recharts").then((mod) => {
    const { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } = mod;
    return {
      default: ({ data }: { data: { name: string; color: string; count: number }[] }) => (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              innerRadius={50}
              paddingAngle={2}
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              iconSize={8}
            />
          </PieChart>
        </ResponsiveContainer>
      ),
    };
  }),
  { ssr: false, loading: () => <Skeleton className="h-[300px] w-full" /> }
);

interface TasksByStatusChartProps {
  data: { name: string; color: string; count: number }[];
  isLoading: boolean;
}

export function TasksByStatusChart({
  data,
  isLoading,
}: TasksByStatusChartProps) {
  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            Tasks by Status
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center pb-6">
          <Skeleton className="h-[250px] w-[250px] rounded-full" />
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            Tasks by Status
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
          Tasks by Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <RechartsComponents data={data} />
      </CardContent>
    </Card>
  );
}
