"use client";

import { useState, useEffect } from "react";
import { Play, Square, Clock } from "lucide-react";
import { useRunningTimer, useTimerActions } from "@/hooks/use-time-entries";
import { TimerDisplay } from "./timer-display";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

interface TaskOption {
  id: string;
  title: string;
}

export function TimerButton() {
  const { runningTimer, mutate } = useRunningTimer();
  const { startTimer, stopTimer } = useTimerActions();
  const { toast } = useToast();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [taskSearch, setTaskSearch] = useState("");
  const [searchResults, setSearchResults] = useState<TaskOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [stopping, setStopping] = useState(false);

  // Persist timer state in localStorage for instant display on navigation
  useEffect(() => {
    if (runningTimer) {
      localStorage.setItem(
        "runningTimer",
        JSON.stringify({
          id: runningTimer.id,
          taskId: runningTimer.taskId,
          taskTitle: runningTimer.task.title,
          startTime: runningTimer.startTime,
        })
      );
    } else if (runningTimer === null) {
      localStorage.removeItem("runningTimer");
    }
  }, [runningTimer]);

  // Search tasks for the timer
  useEffect(() => {
    if (!taskSearch.trim()) {
      setSearchResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(taskSearch)}&type=task&limit=8`
        );
        if (res.ok) {
          const data = await res.json();
          // The search API may return various formats, extract tasks
          const tasks: TaskOption[] = (data.tasks ?? data ?? []).map(
            (t: { id: string; title: string }) => ({
              id: t.id,
              title: t.title,
            })
          );
          setSearchResults(tasks);
        }
      } catch {
        // ignore search errors
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [taskSearch]);

  const handleStart = async (taskId: string) => {
    try {
      await startTimer(taskId);
      mutate();
      setPopoverOpen(false);
      setTaskSearch("");
      toast({
        title: "Chrono démarré",
        description: "Suivi du temps pour cette tâche.",
      });
    } catch (err) {
      toast({
        title: "Erreur",
        description:
          err instanceof Error ? err.message : "Failed to start timer",
        variant: "destructive",
      });
    }
  };

  const handleStop = async () => {
    setStopping(true);
    try {
      await stopTimer();
      mutate();
      localStorage.removeItem("runningTimer");
      toast({
        title: "Chrono arrêté",
        description: "Entrée de temps sauvegardée.",
      });
    } catch (err) {
      toast({
        title: "Erreur",
        description:
          err instanceof Error ? err.message : "Failed to stop timer",
        variant: "destructive",
      });
    } finally {
      setStopping(false);
    }
  };

  if (runningTimer) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-md bg-green-500/10 px-2.5 py-1">
          <TimerDisplay startTime={runningTimer.startTime} />
          <span className="max-w-[120px] truncate text-xs text-muted-foreground">
            {runningTimer.task.title}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-red-500 hover:bg-red-500/10 hover:text-red-600"
          onClick={handleStop}
          disabled={stopping}
        >
          <Square className="h-3.5 w-3.5 fill-current" />
        </Button>
      </div>
    );
  }

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <Clock className="h-4 w-4" />
          <Play className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="end">
        <div className="space-y-2">
          <p className="text-sm font-medium">Démarrer le chrono</p>
          <p className="text-xs text-muted-foreground">
            Rechercher une tâche pour commencer le suivi
          </p>
          <Input
            placeholder="Rechercher des tâches..."
            value={taskSearch}
            onChange={(e) => setTaskSearch(e.target.value)}
            autoFocus
          />
          {searching && (
            <p className="text-xs text-muted-foreground py-2">Recherche...</p>
          )}
          {searchResults.length > 0 && (
            <div className="max-h-48 overflow-y-auto space-y-0.5">
              {searchResults.map((task) => (
                <button
                  key={task.id}
                  onClick={() => handleStart(task.id)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent transition-colors"
                >
                  <Play className="h-3 w-3 shrink-0 text-green-500" />
                  <span className="truncate">{task.title}</span>
                </button>
              ))}
            </div>
          )}
          {taskSearch && !searching && searchResults.length === 0 && (
            <p className="text-xs text-muted-foreground py-2">
              Aucune tâche trouvée. Essayez un autre terme.
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
