"use client";

import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Clock,
  Trash2,
  DollarSign,
} from "lucide-react";
import { useTimeEntries, useTimerActions } from "@/hooks/use-time-entries";
import { formatSeconds, formatSecondsShort } from "./timer-display";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import type { TimeEntryWithDetails } from "@/types";

interface TimeEntryListProps {
  taskId: string;
}

export function TimeEntryList({ taskId }: TimeEntryListProps) {
  const { entries, isLoading, mutate } = useTimeEntries(taskId);
  const { deleteEntry } = useTimerActions();
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const completedEntries = entries.filter(
    (e: TimeEntryWithDetails) => e.duration != null
  );
  const totalSeconds = completedEntries.reduce(
    (sum: number, e: TimeEntryWithDetails) => sum + (e.duration ?? 0),
    0
  );

  const handleDelete = async (entryId: string) => {
    setDeletingId(entryId);
    try {
      await deleteEntry(entryId);
      mutate();
      toast({ title: "Entrée supprimée" });
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'entrée",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="h-12 animate-pulse rounded-md bg-muted/50"
          />
        ))}
      </div>
    );
  }

  if (completedEntries.length === 0) {
    return (
      <div className="text-center py-4">
        <Clock className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">
          {"Aucune entrée de temps. Démarrez un chrono ou saisissez le temps manuellement."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Total time */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Temps total suivi</span>
        <span className="text-sm font-semibold font-mono">
          {formatSecondsShort(totalSeconds)}
        </span>
      </div>

      {/* Entries */}
      <div className="space-y-1.5">
        {completedEntries.map((entry: TimeEntryWithDetails) => (
          <div
            key={entry.id}
            className="group flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent/50 transition-colors"
          >
            <Avatar className="h-5 w-5 shrink-0">
              <AvatarImage src={entry.user.image ?? undefined} />
              <AvatarFallback className="text-[8px]">
                {(entry.user.name ?? entry.user.email)?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                {entry.description && (
                  <span className="truncate text-xs">
                    {entry.description}
                  </span>
                )}
                {entry.billable && (
                  <Badge
                    variant="outline"
                    className="h-4 px-1 text-[9px] text-green-600 border-green-600/30"
                  >
                    <DollarSign className="h-2.5 w-2.5 mr-0.5" />
                    Facturable
                  </Badge>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground">
                {format(new Date(entry.startTime), "d MMM, HH:mm", { locale: fr })}
                {entry.endTime &&
                  ` — ${format(new Date(entry.endTime), "HH:mm")}`}
              </span>
            </div>

            <span className="font-mono text-xs font-medium tabular-nums shrink-0">
              {formatSeconds(entry.duration ?? 0)}
            </span>

            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => handleDelete(entry.id)}
                disabled={deletingId === entry.id}
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
