"use client";

import { memo } from "react";
import { motion } from "framer-motion";
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
import { staggerContainer, staggerItem } from "@/components/ui/animated-container";

interface StatsCardsProps {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  tasksDueThisWeek: number;
  isLoading: boolean;
  onCardClick?: (key: string) => void;
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
  onCardClick,
}: StatsCardsProps) {
  const values = { totalTasks, completedTasks, overdueTasks, tasksDueThisWeek };

  // Compute completion rate trend
  const completionRate = totalTasks > 0
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0;

  if (isLoading) {
    return (
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4"
      >
        {cards.map((c, i) => (
          <motion.div key={i} variants={staggerItem} className="rounded-2xl border bg-card p-4 md:p-5 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-24" />
          </motion.div>
        ))}
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4"
    >
      {cards.map((card) => {
        const Icon = card.icon;
        const value = values[card.key];
        const isOverdue = card.key === "overdueTasks" && value > 0;

        return (
          <motion.button
            key={card.key}
            variants={staggerItem}
            whileHover={{ y: -3, transition: { type: "spring", stiffness: 400, damping: 17 } }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onCardClick?.(card.key)}
            className={cn(
              "group relative overflow-hidden rounded-2xl border bg-card p-4 md:p-5 w-full text-left",
              "hover:shadow-lg transition-shadow duration-300",
              "bg-gradient-to-br cursor-pointer",
              card.gradient
            )}
          >
            <div className="flex items-center justify-between">
              <motion.div
                className={cn("rounded-xl p-2.5", card.iconBg)}
                whileHover={{ rotate: 5, scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
              >
                <Icon className="h-6 w-6" />
              </motion.div>
              {card.key === "completedTasks" && (
                <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                  <TrendingUp className="h-6 w-6" />
                  {completionRate}%
                </div>
              )}
              {isOverdue && (
                <div className="flex items-center gap-1 text-sm font-medium text-red-600">
                  <TrendingDown className="h-6 w-6" />
                  Attention
                </div>
              )}
            </div>

            <div className="mt-3">
              <motion.p
                key={value}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="text-2xl md:text-3xl font-bold tracking-tight"
              >
                {value.toLocaleString("fr-FR")}
              </motion.p>
              <p className="text-sm md:text-base text-muted-foreground mt-0.5">
                {card.label}
              </p>
            </div>

            <div
              className={cn(
                "absolute inset-0 rounded-2xl ring-1 ring-inset opacity-0 group-hover:opacity-100 transition-opacity",
                card.ring
              )}
            />
          </motion.button>
        );
      })}
    </motion.div>
  );
});
