"use client";

import { format, differenceInDays, isPast } from "date-fns";
import { CalendarDays, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface DeadlineTask {
  id: string;
  title: string;
  priority: string;
  dueDate: string;
  status: {
    id: string;
    name: string;
    color: string;
  };
  assignee: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  } | null;
  list: {
    id: string;
    name: string;
  };
}

interface UpcomingDeadlinesProps {
  tasks: DeadlineTask[];
  isLoading: boolean;
  onTaskClick?: (taskId: string) => void;
}

const PRIORITY_STYLES: Record<string, string> = {
  urgent: "bg-red-500/10 text-red-500 border-red-500/20",
  high: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  normal: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  low: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

function getUrgencyColor(dueDate: string): string {
  const due = new Date(dueDate);
  if (isPast(due)) return "text-red-500";
  const daysUntil = differenceInDays(due, new Date());
  if (daysUntil <= 1) return "text-red-400";
  if (daysUntil <= 3) return "text-orange-400";
  return "text-muted-foreground";
}

export function UpcomingDeadlines({
  tasks,
  isLoading,
  onTaskClick,
}: UpcomingDeadlinesProps) {
  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Upcoming Deadlines
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-2 rounded-lg border p-3">
              <Skeleton className="h-4 w-3/4" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-16" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">
          Upcoming Deadlines
        </CardTitle>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <CalendarDays className="mb-2 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              No upcoming deadlines
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <button
                key={task.id}
                onClick={() => onTaskClick?.(task.id)}
                className="w-full rounded-lg border border-border/50 p-3 text-left transition-colors hover:bg-muted/50"
              >
                <p className="mb-2 truncate text-sm font-medium">
                  {task.title}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {/* Status badge */}
                  <div className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: task.status.color }}
                    />
                    <span className="text-muted-foreground">
                      {task.status.name}
                    </span>
                  </div>

                  {/* Priority badge */}
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] capitalize",
                      PRIORITY_STYLES[task.priority]
                    )}
                  >
                    {task.priority}
                  </Badge>

                  {/* Due date */}
                  <div
                    className={cn(
                      "ml-auto flex items-center gap-1 text-xs",
                      getUrgencyColor(task.dueDate)
                    )}
                  >
                    <Clock className="h-3 w-3" />
                    <span>{format(new Date(task.dueDate), "MMM d")}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
