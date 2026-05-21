"use client";

import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, isToday, isTomorrow } from "date-fns";
import { fr } from "date-fns/locale";
import { Clock, ArrowRight, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/components/ui/animated-container";

interface DeadlineTask {
  id: string;
  title: string;
  dueDate: string;
  priority: string;
  status: { id: string; name: string; color: string };
  assignee?: {
    id: string;
    name: string | null;
    email: string;
    image?: string | null;
  } | null;
  list?: { id: string; name: string } | null;
}

const PRIORITY_DOT: Record<string, string> = {
  urgent: "bg-red-500",
  high: "bg-orange-500",
  normal: "bg-blue-400",
  low: "bg-gray-400",
};

function dueLabel(dateStr: string): string {
  const d = new Date(dateStr);
  if (isToday(d)) return "Aujourd'hui";
  if (isTomorrow(d)) return "Demain";
  const days = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days <= 7) return `Dans ${days} jours`;
  return format(d, "d MMM", { locale: fr });
}

interface UpcomingDeadlinesProps {
  tasks: DeadlineTask[];
  isLoading: boolean;
}

export const UpcomingDeadlines = memo(function UpcomingDeadlines({
  tasks,
  isLoading,
}: UpcomingDeadlinesProps) {
  if (isLoading) {
    return (
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="rounded-2xl border bg-card p-5 space-y-4"
      >
        <Skeleton className="h-5 w-40" />
        {[1, 2, 3, 4, 5].map((i) => (
          <motion.div key={i} variants={staggerItem} className="flex items-center gap-3 p-2">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-24" />
            </div>
          </motion.div>
        ))}
      </motion.div>
    );
  }

  if (tasks.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl border bg-card p-5 flex flex-col items-center justify-center min-h-[280px]"
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <Calendar className="h-9 w-9 text-muted-foreground/40 mb-3" />
        </motion.div>
        <p className="text-base text-muted-foreground">Aucune échéance prochaine</p>
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
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <span className="h-4 w-4 rounded-full bg-primary" />
          Échéances prochaines
        </h3>
        <span className="text-sm text-muted-foreground">
          {tasks.length} tâche{tasks.length > 1 ? "s" : ""}
        </span>
      </div>

      <div className="space-y-1">
        <AnimatePresence>
        {tasks.map((task) => {
          const isUrgent =
            task.priority === "urgent" ||
            (new Date(task.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24) <= 1;

          return (
            <motion.div
              key={task.id}
              variants={staggerItem}
              layout
              whileHover={{ x: 3, backgroundColor: "hsl(var(--muted) / 0.5)" }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={cn(
                "group flex items-center gap-3 p-2.5 -mx-1 rounded-xl",
                "cursor-pointer"
              )}
            >
              {/* Status color indicator */}
              <div
                className="h-9 w-1.5 rounded-full shrink-0"
                style={{ backgroundColor: task.status.color }}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{task.title}</p>
                  <div
                    className={cn("h-2 w-2 rounded-full shrink-0", PRIORITY_DOT[task.priority])}
                  />
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className={cn(
                      "text-sm font-medium",
                      isUrgent ? "text-red-500" : "text-muted-foreground"
                    )}
                  >
                    {dueLabel(task.dueDate)}
                  </span>
                  <span className="text-sm text-muted-foreground/50">·</span>
                  <span className="text-sm text-muted-foreground/60 truncate max-w-[100px]">
                    {task.list?.name}
                  </span>
                </div>
              </div>

              {/* Assignee */}
              {task.assignee ? (
                <Avatar className="h-8 w-8 border-2 border-background shrink-0">
                  {task.assignee.image ? (
                    <AvatarImage src={task.assignee.image} alt={task.assignee.name ?? ""} />
                  ) : null}
                  <AvatarFallback className="text-xs bg-muted">
                    {task.assignee.name?.charAt(0).toUpperCase() ??
                      task.assignee.email.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="h-7 w-7 rounded-full bg-muted/50 flex items-center justify-center shrink-0">
                  <Clock className="h-5 w-5 text-muted-foreground/40" />
                </div>
              )}

              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <ArrowRight className="h-6 w-6 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors shrink-0" />
              </motion.div>
            </motion.div>
          );
        })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});
