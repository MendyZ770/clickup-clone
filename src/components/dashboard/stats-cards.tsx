"use client";

import { memo, useEffect, useState } from "react";
import { motion, animate } from "framer-motion";
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

function AnimatedCounter({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 1.5,
      ease: [0.16, 1, 0.3, 1], // Custom sleek ease-out
      onUpdate(v) {
        setDisplayValue(Math.round(v));
      },
    });
    return () => controls.stop();
  }, [value]);

  return <>{displayValue.toLocaleString("fr-FR")}</>;
}

export const StatsCards = memo(function StatsCards({
  totalTasks,
  completedTasks,
  overdueTasks,
  tasksDueThisWeek,
  isLoading,
  onCardClick,
}: StatsCardsProps) {
  const values = { totalTasks, completedTasks, overdueTasks, tasksDueThisWeek };

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
          <motion.div key={i} variants={staggerItem} className="rounded-[2rem] border border-border/30 bg-card/40 backdrop-blur-xl p-6 space-y-3 shadow-sm">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-2xl" />
            </div>
            <Skeleton className="h-8 w-16 mt-4" />
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
            whileHover={{ y: -4, scale: 1.01, transition: { type: "spring", stiffness: 400, damping: 17 } }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onCardClick?.(card.key)}
            className={cn(
              "group relative overflow-hidden rounded-[2rem] border border-border/30 bg-card/40 backdrop-blur-xl p-6 w-full text-left",
              "shadow-xl shadow-black/5 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500",
              "cursor-pointer",
              card.gradient
            )}
          >
            {/* Glassmorphism subtle overlay */}
            <div className="absolute inset-0 bg-background/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            <div className="flex items-center justify-between relative z-10">
              <motion.div
                className={cn("rounded-2xl p-3 shadow-sm", card.iconBg)}
                whileHover={{ rotate: 8, scale: 1.1 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
              >
                <Icon className="h-6 w-6" />
              </motion.div>
              {card.key === "completedTasks" && (
                <div className="flex items-center gap-1 text-sm font-bold text-green-600 bg-green-500/10 px-2 py-1 rounded-full">
                  <TrendingUp className="h-4 w-4" />
                  {completionRate}%
                </div>
              )}
              {isOverdue && (
                <div className="flex items-center gap-1 text-sm font-bold text-red-600 bg-red-500/10 px-2 py-1 rounded-full animate-pulse">
                  <TrendingDown className="h-4 w-4" />
                  Attention
                </div>
              )}
            </div>

            <div className="mt-4 relative z-10">
              <motion.p
                className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground"
              >
                <AnimatedCounter value={value} />
              </motion.p>
              <p className="text-sm font-medium text-muted-foreground mt-1 tracking-tight">
                {card.label}
              </p>
            </div>

            <div
              className={cn(
                "absolute inset-0 rounded-3xl ring-1 ring-inset opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                card.ring
              )}
            />
          </motion.button>
        );
      })}
    </motion.div>
  );
});
