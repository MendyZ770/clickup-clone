"use client";

import { useState, useEffect, useMemo } from "react";
import {
  format,
  addDays,
  startOfWeek,
  isToday,
  isSameDay,
  isWithinInterval,
  startOfDay,
  endOfDay,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTasks } from "@/hooks/use-tasks";
import { useFilters } from "@/hooks/use-filters";
import { useModal } from "@/hooks/use-modal";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const DAYS_TO_SHOW = 14;

interface WorkloadViewProps {
  listId: string;
  workspaceId: string;
}

export function WorkloadView({ listId, workspaceId }: WorkloadViewProps) {
  const { getFilter } = useFilters();
  const { setWorkspaceId, openTaskModal } = useModal();
  const [startDate, setStartDate] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));

  useEffect(() => { setWorkspaceId(workspaceId); }, [workspaceId, setWorkspaceId]);

  const { tasks, isLoading } = useTasks(
    { listId },
    {
      statusId: getFilter("statusId") ?? undefined,
      priority: getFilter("priority") ?? undefined,
      assigneeId: getFilter("assigneeId") ?? undefined,
      search: getFilter("search") ?? undefined,
    }
  );

  const days = useMemo(() => {
    return Array.from({ length: DAYS_TO_SHOW }, (_, i) => addDays(startDate, i));
  }, [startDate]);

  // Extract unique users from tasks assignees
  const users = useMemo(() => {
    const userMap = new Map();
    tasks.forEach(t => {
      t.assignees?.forEach(a => {
        if (!userMap.has(a.user.id)) {
          userMap.set(a.user.id, a.user);
        }
      });
    });
    return Array.from(userMap.values());
  }, [tasks]);

  // Calculate workload per user per day (in hours)
  // Assuming timeEstimate is in milliseconds
  const getWorkload = (userId: string, day: Date) => {
    let totalMs = 0;
    const dayTasks: any[] = [];

    tasks.forEach(t => {
      const isAssigned = t.assignees?.some(a => a.user.id === userId);
      if (!isAssigned || !t.timeEstimate || (!t.startDate && !t.dueDate)) return;

      const tStart = startOfDay(new Date(t.startDate || t.createdAt));
      const tEnd = endOfDay(new Date(t.dueDate || t.startDate || t.createdAt));

      if (isWithinInterval(day, { start: tStart, end: tEnd })) {
        // Divide timeEstimate by the number of days the task spans
        const durationDays = Math.max(1, Math.ceil((tEnd.getTime() - tStart.getTime()) / (1000 * 60 * 60 * 24)));
        totalMs += (t.timeEstimate / durationDays);
        dayTasks.push(t);
      }
    });

    const hours = totalMs / (1000 * 60 * 60);
    return { hours, tasks: dayTasks };
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><LoadingSpinner size="lg" /></div>;
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p>Aucun membre assigné aux tâches avec estimation de temps.</p>
      </div>
    );
  }

  return (
    <div className="p-2 md:p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1 md:gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setStartDate(addDays(startDate, -7))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium w-[160px] text-center">
            {format(startDate, "d MMM")} - {format(addDays(startDate, DAYS_TO_SHOW - 1), "d MMM yyyy")}
          </span>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setStartDate(addDays(startDate, 7))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setStartDate(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
            Aujourd&apos;hui
          </Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/30 text-muted-foreground">
            <tr>
               <th className="px-4 py-3 font-medium border-b border-r min-w-[200px] sticky left-0 bg-background/95 backdrop-blur z-10">
                 Membre
               </th>
               {days.map(day => (
                 <th key={day.toISOString()} className={cn(
                   "px-2 py-3 font-medium border-b border-r text-center min-w-[80px]",
                   isToday(day) && "bg-primary/10 text-primary"
                 )}>
                   <div className="text-[10px] uppercase mb-1">{format(day, "EEE")}</div>
                   <div>{format(day, "d")}</div>
                 </th>
               ))}
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-b hover:bg-muted/10 transition-colors">
                <td className="px-4 py-3 border-r sticky left-0 bg-background/95 backdrop-blur z-10 flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.image || ""} />
                    <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium truncate max-w-[140px]">{user.name}</span>
                </td>
                {days.map(day => {
                  const { hours } = getWorkload(user.id, day);
                  const isOverloaded = hours > 8;
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                  
                  return (
                    <td key={day.toISOString()} className={cn(
                      "px-2 py-3 border-r text-center transition-all",
                      isWeekend && "bg-muted/20",
                      isOverloaded && "bg-destructive/10"
                    )}>
                      {hours > 0 ? (
                        <div className={cn(
                          "inline-flex items-center justify-center px-2 py-1 rounded-md text-xs font-semibold w-full",
                          isOverloaded ? "bg-destructive text-destructive-foreground" : "bg-primary/10 text-primary"
                        )}>
                          {hours.toFixed(1)}h
                        </div>
                      ) : (
                        <span className="text-muted-foreground/30">-</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
