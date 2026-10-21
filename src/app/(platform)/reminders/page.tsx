"use client";

import { useState, useMemo } from "react";
import { Bell, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkspace } from "@/hooks/use-workspace";
import { useReminders } from "@/hooks/use-reminders";
import { ReminderList } from "@/components/reminders/reminder-list";
import { CreateReminderDialog } from "@/components/reminders/create-reminder-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { useToast } from "@/components/ui/use-toast";

type Filter = "all" | "upcoming" | "completed";

export default function RemindersPage() {
  const { currentWorkspace, isLoading: workspaceLoading } = useWorkspace();
  const [filter, setFilter] = useState<Filter>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const {
    reminders,
    isLoading,
    isError,
    mutate,
    createReminder,
    toggleComplete,
    deleteReminder,
  } = useReminders(currentWorkspace?.id);

  const handleToggleComplete = async (id: string, completed: boolean) => {
    try {
      await toggleComplete(id, completed);
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de mettre à jour le rappel.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteReminder(id);
      toast({ title: "Rappel supprimé" });
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de supprimer le rappel.",
        variant: "destructive",
      });
    }
  };

  const filteredReminders = useMemo(() => {
    if (filter === "upcoming") {
      return reminders.filter((r) => {
        const remindDate = new Date(r.remindAt);
        return !r.completed && remindDate >= new Date();
      });
    }
    if (filter === "completed") {
      return reminders.filter((r) => r.completed);
    }
    return reminders;
  }, [reminders, filter]);

  const completedCount = reminders.filter((r) => r.completed).length;
  const upcomingCount = reminders.filter((r) => {
    const remindDate = new Date(r.remindAt);
    return !r.completed && remindDate >= new Date();
  }).length;

  if (workspaceLoading) {
    return (
      <div className="mx-auto max-w-3xl p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <div className="mx-auto max-w-3xl p-4 md:p-6">
        <EmptyState
          icon={Bell}
          title="Aucun espace sélectionné"
          description="Sélectionnez un espace de travail pour voir vos rappels."
        />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-3xl p-4 md:p-6">
        <ErrorState onRetry={() => mutate()} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6 space-y-4 md:space-y-6">
      <PageHeader
        icon={Bell}
        title="Rappels"
        description={
          reminders.length === 0
            ? "Aucun rappel"
            : `${reminders.length} rappel${reminders.length > 1 ? "s" : ""}`
        }
        actions={
          <Button onClick={() => setDialogOpen(true)} className="gap-2" size="sm">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nouveau rappel</span>
            <span className="sm:hidden">Nouveau</span>
          </Button>
        }
      />

      {/* Filter tabs */}
      <div
        role="tablist"
        aria-label="Filtrer les rappels"
        className="flex gap-1 rounded-lg border border-border/50 bg-muted/30 p-1"
      >
        <button
          role="tab"
          type="button"
          aria-selected={filter === "all"}
          onClick={() => setFilter("all")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            filter === "all"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Tous
        </button>
        <button
          role="tab"
          type="button"
          aria-selected={filter === "upcoming"}
          onClick={() => setFilter("upcoming")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            filter === "upcoming"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          À venir
          {upcomingCount > 0 && (
            <span
              aria-hidden="true"
              className="ml-1.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white"
            >
              {upcomingCount}
            </span>
          )}
        </button>
        <button
          role="tab"
          type="button"
          aria-selected={filter === "completed"}
          onClick={() => setFilter("completed")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            filter === "completed"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Terminés
          {completedCount > 0 && (
            <span
              aria-hidden="true"
              className="ml-1.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-muted-foreground/20 px-1.5 text-[10px] font-bold text-muted-foreground"
            >
              {completedCount}
            </span>
          )}
        </button>
      </div>

      {/* Reminder list */}
      <ReminderList
        reminders={filteredReminders}
        isLoading={isLoading}
        onToggleComplete={handleToggleComplete}
        onDelete={handleDelete}
      />

      {/* Create dialog */}
      <CreateReminderDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={createReminder}
        workspaceId={currentWorkspace.id}
      />
    </div>
  );
}
