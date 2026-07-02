"use client";

import { memo, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";

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
}: {
  offset: number;
  dash: number;
  color: string;
  total: number;
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
      <div className="rounded-[2rem] border border-border/30 bg-card/40 backdrop-blur-xl p-6 space-y-4 shadow-sm h-full flex flex-col">
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
      <div className="rounded-[2rem] border border-border/30 bg-card/40 backdrop-blur-xl p-6 flex flex-col items-center justify-center h-full shadow-sm">
        <p className="text-sm text-muted-foreground font-medium">Aucune tâche</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-border/30 bg-card/40 backdrop-blur-xl p-6 shadow-xl shadow-black/5 hover:shadow-2xl transition-all duration-500 group h-full flex flex-col">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      <div className="flex items-center justify-between mb-4 relative z-10">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-primary" />
          Répartition par statut
        </h3>
        <span className="text-sm text-muted-foreground">{total} tâches</span>
      </div>

      {/* Donut */}
      <div className="relative flex items-center justify-center py-5">
        <svg viewBox="0 0 100 100" className="h-40 w-40 -rotate-90">
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="10"
          />
          {segments.map((seg) => (
            <DonutSegment
              key={seg.name}
              offset={seg.offset}
              dash={seg.count}
              color={seg.color}
              total={total}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-bold">{total}</span>
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Total</span>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-1 flex-grow overflow-y-auto pr-2 custom-scrollbar">
        {data.map((item) => {
          const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
          return (
            <div
              key={item.name}
              className="flex items-center justify-between text-sm py-1.5 px-2 -mx-2 rounded-lg hover:bg-muted/40 transition-colors group cursor-default"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                  {item.name}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-medium tabular-nums text-foreground">{item.count}</span>
                <span className="text-sm text-muted-foreground w-7 text-right">
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
