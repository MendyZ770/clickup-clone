"use client";

import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ArrowRight,
  Edit3,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/components/ui/animated-container";

interface ActivityItem {
  id: string;
  action: string;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  task: {
    id: string;
    title: string;
  };
}

interface RecentActivityProps {
  activities: ActivityItem[];
  isLoading: boolean;
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  created: <Plus className="h-6 w-6" />,
  updated: <Edit3 className="h-6 w-6" />,
  deleted: <Trash2 className="h-6 w-6" />,
  moved: <ArrowRight className="h-6 w-6" />,
  completed: <CheckCircle2 className="h-6 w-6" />,
  due_soon: <Clock className="h-6 w-6" />,
  overdue: <AlertCircle className="h-6 w-6" />,
  comment: <MessageSquare className="h-6 w-6" />,
};

const ACTION_COLORS: Record<string, string> = {
  created: "bg-blue-500/10 text-blue-600 ring-blue-500/20",
  updated: "bg-amber-500/10 text-amber-600 ring-amber-500/20",
  deleted: "bg-red-500/10 text-red-600 ring-red-500/20",
  moved: "bg-purple-500/10 text-purple-600 ring-purple-500/20",
  completed: "bg-green-500/10 text-green-600 ring-green-500/20",
  due_soon: "bg-orange-500/10 text-orange-600 ring-orange-500/20",
  overdue: "bg-red-500/10 text-red-600 ring-red-500/20",
  comment: "bg-indigo-500/10 text-indigo-600 ring-indigo-500/20",
};

function getActivityDescription(activity: ActivityItem): string {
  const taskTitle =
    activity.task.title.length > 30
      ? activity.task.title.slice(0, 30) + "..."
      : activity.task.title;

  if (activity.action === "created") {
    return `created task "${taskTitle}"`;
  }

  if (activity.action === "updated" && activity.field) {
    if (activity.field === "status") {
      return `changed status of "${taskTitle}" from ${activity.oldValue ?? "—"} to ${activity.newValue ?? "—"}`;
    }
    if (activity.field === "priority") {
      return `changed priority of "${taskTitle}" to ${activity.newValue ?? "—"}`;
    }
    if (activity.field === "assignee") {
      return `updated assignee on "${taskTitle}"`;
    }
    return `updated ${activity.field} on "${taskTitle}"`;
  }

  if (activity.action === "deleted") {
    return `deleted task "${taskTitle}"`;
  }

  return `${activity.action} on "${taskTitle}"`;
}


export const RecentActivity = memo(function RecentActivity({ activities, isLoading }: RecentActivityProps) {
  if (isLoading) {
    return (
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="rounded-2xl border bg-card p-5 space-y-4"
      >
        <Skeleton className="h-5 w-32" />
        {[1, 2, 3, 4, 5].map((i) => (
          <motion.div key={i} variants={staggerItem} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-20" />
            </div>
          </motion.div>
        ))}
      </motion.div>
    );
  }

  if (activities.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl border bg-card p-5 flex flex-col items-center justify-center min-h-[280px]"
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Clock className="h-9 w-9 text-muted-foreground/40 mb-3" />
        </motion.div>
        <p className="text-base text-muted-foreground">Aucune activité récente</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="rounded-2xl border bg-card p-5 hover:shadow-sm transition-shadow"
    >
      <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
        <motion.span
          className="h-4 w-4 rounded-full bg-primary"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        Activité récente
      </h3>

      <div className="relative space-y-0">
        {/* Timeline line */}
        <motion.div
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute left-4 top-2 bottom-2 w-px bg-border origin-top"
        />

        <AnimatePresence>
        {activities.map((activity, index) => {
          const icon = ACTION_ICONS[activity.action] ?? ACTION_ICONS.updated;
          const color = ACTION_COLORS[activity.action] ?? ACTION_COLORS.updated;
          const timeAgo = formatDistanceToNow(new Date(activity.createdAt), {
            addSuffix: true,
            locale: fr,
          });

          return (
            <motion.div
              key={activity.id}
              variants={staggerItem}
              layout
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ backgroundColor: "hsl(var(--muted) / 0.4)", x: 2 }}
              className={cn(
                "relative flex gap-3 pl-1 pr-1 py-2.5 rounded-lg cursor-default",
                index !== activities.length - 1 && "border-b border-border/50"
              )}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 15, delay: index * 0.05 }}
                className={cn(
                  "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-2",
                  color
                )}
              >
                {icon}
              </motion.div>

              <div className="flex-1 min-w-0">
                <p className="text-sm leading-snug">
                  <span className="font-medium text-foreground">
                    {activity.user?.name ?? activity.user?.email ?? "Quelqu'un"}
                  </span>{" "}
                  <span className="text-muted-foreground">
                    {getActivityDescription(activity)}
                  </span>
                </p>
                {activity.task && (
                  <p className="text-sm text-primary mt-0.5 truncate">
                    {activity.task.title}
                  </p>
                )}
                <p className="text-sm text-muted-foreground/60 mt-1">
                  {timeAgo}
                </p>
              </div>
            </motion.div>
          );
        })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});
