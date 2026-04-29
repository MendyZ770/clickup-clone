"use client";

import { Play, Square, Clock } from "lucide-react";
import {
  useRunningTimer,
  useTimerActions,
  useTimeEntries,
} from "@/hooks/use-time-entries";
import { TimerDisplay } from "./timer-display";
import { TimeEntryList } from "./time-entry-list";
import { ManualTimeEntry } from "./manual-time-entry";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface TaskTimeTrackingProps {
  taskId: string;
}

export function TaskTimeTracking({ taskId }: TaskTimeTrackingProps) {
  const { runningTimer, mutate: mutateTimer } = useRunningTimer();
  const { startTimer, stopTimer } = useTimerActions();
  const { mutate: mutateEntries } = useTimeEntries(taskId);
  const { toast } = useToast();

  const isRunningForThisTask = runningTimer?.taskId === taskId;

  const handleStartStop = async () => {
    try {
      if (isRunningForThisTask) {
        await stopTimer();
        mutateTimer();
        mutateEntries();
        toast({ title: "Chrono arrêté" });
      } else {
        if (runningTimer) {
          // Stop existing timer first
          await stopTimer();
        }
        await startTimer(taskId);
        mutateTimer();
        toast({ title: "Chrono démarré" });
      }
    } catch (err) {
      toast({
        title: "Erreur",
        description:
          err instanceof Error ? err.message : "Action impossible",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Time Tracking</h3>
        </div>

        <div className="flex items-center gap-2">
          <ManualTimeEntry
            taskId={taskId}
            onCreated={() => mutateEntries()}
          />

          <Button
            variant={isRunningForThisTask ? "destructive" : "default"}
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={handleStartStop}
          >
            {isRunningForThisTask ? (
              <>
                <Square className="h-3 w-3 fill-current" />
                Stop
              </>
            ) : (
              <>
                <Play className="h-3 w-3" />
                Start Timer
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Show running timer for this task */}
      {isRunningForThisTask && runningTimer && (
        <div className="flex items-center gap-2 rounded-md bg-green-500/10 px-3 py-2">
          <TimerDisplay startTime={runningTimer.startTime} />
          <span className="text-xs text-muted-foreground">Timer running</span>
        </div>
      )}

      {/* Time entry list */}
      <TimeEntryList taskId={taskId} />
    </div>
  );
}
