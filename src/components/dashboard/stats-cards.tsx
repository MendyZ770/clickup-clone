"use client";

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

export function StatsCards({
  totalTasks,
  completedTasks,
  overdueTasks,
  tasksDueThisWeek,
  isLoading,
}: StatsCardsProps) {
  const values = { totalTasks, completedTasks, overdueTasks, tasksDueThisWeek };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.key} className="border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-7 w-12" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((s) => {
        const Icon = s.icon;
        const value = values[s.key];
        return (
          <Card
            key={s.key}
            className={`border-border/50 transition-shadow hover:shadow-md`}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${s.bgColor}`}
                >
                  <Icon className={`h-6 w-6 ${s.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-bold">{value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
