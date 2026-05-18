"use client";

import { memo, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface StatusData {
  name: string;
  color: string;
  count: number;
}

interface TasksByStatusChartProps {
  data: StatusData[];
  isLoading: boolean;
}

function DonutSegment({
  offset,
  dash,
  color,
  total,
  index,
}: {
  offset: number;
  dash: number;
  color: string;
  total: number;
  index: number;
}) {
  const circumference = 2 * Math.PI * 40; // r=40
  return (
    <circle
      cx="50"
      cy="50"
      r="40"
      fill="none"
      stroke={color}
      strokeWidth="12"
      strokeLinecap="round"
      strokeDasharray={`${(dash / total) * circumference} ${circumference}`}
      strokeDashoffset={-(offset / total) * circumference}
      className="transition-all duration-1000 ease-out"
      style={{ transformOrigin: "center", transform: "rotate(-90deg)" }}
    />
  );
}

export const TasksByStatusChart = memo(function TasksByStatusChart({
  data,
  isLoading,
}: TasksByStatusChartProps) {
  const total = useMemo(
    () => data.reduce((sum, d) => sum + d.count, 0),
    [data]
  );

  const segments = useMemo(() => {
    let offset = 0;
    return data.map((d) => {
      const seg = { ...d, offset };
      offset += d.count;
      return seg;
    });
  }, [data]);

  if (isLoading) {
    return (
      <div className="rounded-2xl border bg-card p-5 space-y-4">
        <Skeleton className="h-5 w-32" />
        <div className="flex items-center justify-center py-6">
          <Skeleton className="h-40 w-40 rounded-full" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0 || total === 0) {
    return (
      <div className="rounded-2xl border bg-card p-5 flex flex-col items-center justify-center min-h-[280px]">
        <p className="text-sm text-muted-foreground">Aucune tâche</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-card p-5 hover:shadow-sm transition-shadow">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-primary" />
        Répartition par statut
      </h3>

      {/* Donut */}
      <div className="relative flex items-center justify-center py-4">
        <svg viewBox="0 0 100 100" className="h-44 w-44 -rotate-90">
          {/* Background ring */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="12"
          />
          {segments.map((seg, i) => (
            <DonutSegment
              key={seg.name}
              offset={seg.offset}
              dash={seg.count}
              color={seg.color}
              total={total}
              index={i}
            />
          ))}
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-bold">{total}</span>
          <span className="text-xs text-muted-foreground">tâches</span>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-2 mt-2">
        {data.map((item) => {
          const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
          return (
            <div
              key={item.name}
              className="flex items-center justify-between text-sm group"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full shrink-0 ring-2 ring-white dark:ring-transparent"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                  {item.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium tabular-nums">{item.count}</span>
                <span className="text-xs text-muted-foreground w-8 text-right">
                  {pct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
