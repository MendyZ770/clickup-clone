"use client";

import { memo } from "react";
import {
  CheckSquare,
  CircleCheckBig,
  AlertTriangle,
  CalendarClock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsCardsProps {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  tasksDueThisWeek: number;
  isLoading: boolean;
}

const stats = [
  {
    key: "totalTasks" as const,
    label: "Total tâches",
    icon: CheckSquare,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
  },
  {
    key: "completedTasks" as const,
    label: "Terminées",
    icon: CircleCheckBig,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
  },
  {
    key: "overdueTasks" as const,
    label: "En retard",
    icon: AlertTriangle,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
  },
  {
    key: "tasksDueThisWeek" as const,
    label: "Échéance cette semaine",
    icon: CalendarClock,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20",
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

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.key} className="border-border/50">
            <CardContent className="p-3 md:p-5">
              <div className="flex items-center gap-3 md:gap-4">
                <Skeleton className="h-10 w-10 md:h-12 md:w-12 rounded-lg" />
                <div className="space-y-1.5 md:space-y-2">
                  <Skeleton className="h-3 w-16 md:w-20" />
                  <Skeleton className="h-6 md:h-7 w-10 md:w-12" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((s) => {
        const Icon = s.icon;
        const value = values[s.key];
        return (
          <Card
            key={s.key}
            className="border-border/50 hover:border-primary/50 hover:shadow-sm transition-all hover-lift"
          >
            <CardContent className="p-3 md:p-5">
              <div className="flex items-center gap-3 md:gap-4">
                <div
                  className={`flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-lg ${s.bgColor}`}
                >
                  <Icon className={`h-5 w-5 md:h-6 md:w-6 ${s.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] md:text-sm text-muted-foreground truncate">{s.label}</p>
                  <p className="text-xl md:text-2xl font-bold">{value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
});
