"use client";

import { memo } from "react";
import {
  CheckSquare,
  Target,
  AlertTriangle,
  CalendarClock,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface StatsCardsProps {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  tasksDueThisWeek: number;
  isLoading: boolean;
}

const cards = [
  {
    label: "Tâches totales",
    key: "totalTasks" as const,
    icon: CheckSquare,
    gradient: "from-blue-500/10 via-blue-400/5 to-transparent",
    iconBg: "bg-blue-500/10 text-blue-600",
    ring: "ring-blue-500/20",
  },
  {
    label: "Terminées",
    key: "completedTasks" as const,
    icon: Target,
    gradient: "from-green-500/10 via-green-400/5 to-transparent",
    iconBg: "bg-green-500/10 text-green-600",
    ring: "ring-green-500/20",
  },
  {
    label: "En retard",
    key: "overdueTasks" as const,
    icon: AlertTriangle,
    gradient: "from-red-500/10 via-red-400/5 to-transparent",
    iconBg: "bg-red-500/10 text-red-600",
    ring: "ring-red-500/20",
  },
  {
    label: "Cette semaine",
    key: "tasksDueThisWeek" as const,
    icon: CalendarClock,
    gradient: "from-amber-500/10 via-amber-400/5 to-transparent",
    iconBg: "bg-amber-500/10 text-amber-600",
    ring: "ring-amber-500/20",
  },
];

export const StatsCards = memo(function StatsCards({
  totalTasks,
  completedTasks,
  overdueTasks,
  tasksDueThisWeek,
  isLoading,
}: StatsCardsProps) {
  const values = { totalTasks, completedTasks, overdueTasks, tasksDueThisWeek };

  // Compute completion rate trend
  const completionRate = totalTasks > 0
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {cards.map((c, i) => (
          <div key={i} className="rounded-2xl border bg-card p-4 md:p-5 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const value = values[card.key];
        const isOverdue = card.key === "overdueTasks" && value > 0;

        return (
          <div
            key={card.key}
            className={cn(
              "group relative overflow-hidden rounded-2xl border bg-card p-4 md:p-5",
              "hover:shadow-md hover:-translate-y-0.5 transition-all duration-300",
              "bg-gradient-to-br",
              card.gradient
            )}
          >
            <div className="flex items-center justify-between">
              <div className={cn("rounded-xl p-2.5", card.iconBg)}>
                <Icon className="h-5 w-5" />
              </div>
              {card.key === "completedTasks" && (
                <div className="flex items-center gap-1 text-xs font-medium text-green-600">
                  <TrendingUp className="h-3.5 w-3.5" />
                  {completionRate}%
                </div>
              )}
              {isOverdue && (
                <div className="flex items-center gap-1 text-xs font-medium text-red-600">
                  <TrendingDown className="h-3.5 w-3.5" />
                  Attention
                </div>
              )}
            </div>

            <div className="mt-3">
              <p className="text-2xl md:text-3xl font-bold tracking-tight">
                {value.toLocaleString("fr-FR")}
              </p>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                {card.label}
              </p>
            </div>

            <div
              className={cn(
                "absolute inset-0 rounded-2xl ring-1 ring-inset opacity-0 group-hover:opacity-100 transition-opacity",
                card.ring
              )}
            />
          </div>
        );
      })}
    </div>
  );
});
