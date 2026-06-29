"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useSpaces } from "@/hooks/use-spaces";
import { useCreateTask } from "@/hooks/use-tasks";

interface QuickCreateTaskProps {
  workspaceId: string | null;
  onCreated?: () => void;
}

export function QuickCreateTask({ workspaceId, onCreated }: QuickCreateTaskProps) {
  const { toast } = useToast();
  const { createTask } = useCreateTask();
  const { spaces } = useSpaces(workspaceId ?? null);

  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newListId, setNewListId] = useState("");
  const [newPriority, setNewPriority] = useState("normal");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allLists = useMemo(() => {
    const lists: { id: string; name: string; spaceName: string }[] = [];
    for (const space of spaces) {
      for (const list of space.lists ?? []) {
        lists.push({ id: list.id, name: list.name, spaceName: space.name });
      }
    }
    return lists;
  }, [spaces]);

  useEffect(() => {
    if (allLists.length > 0 && !newListId) {
      setNewListId(allLists[0].id);
    }
  }, [allLists, newListId]);

  const handleCreate = async () => {
    const trimmed = newTitle.trim();
    if (!trimmed || !newListId) return;

    setIsSubmitting(true);
    try {
      await createTask({
        title: trimmed,
        listId: newListId,
        priority: newPriority,
      });
      toast({ title: "Tâche créée" });
      setNewTitle("");
      setShowForm(false);
      onCreated?.();
    } catch (err) {
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Impossible de créer la tâche",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {!showForm ? (
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-5 w-5 mr-1.5" />
          Nouvelle tâche
        </Button>
      ) : (
        <div className="rounded-xl border bg-card p-3 md:p-4 space-y-2 md:space-y-3 w-full md:max-w-2xl">
          {allLists.length === 0 ? (
            <div className="space-y-2">
              <p className="text-sm">Aucune liste disponible.</p>
              <p className="text-xs text-muted-foreground">
                Créez d&apos;abord un espace puis une liste pour pouvoir ajouter des tâches.
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowForm(false)}
              >
                Annuler
              </Button>
            </div>
          ) : (
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Titre de la tâche..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleCreate();
                }
              }}
              className="flex-1"
              autoFocus
            />
            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
              <Select value={newListId} onValueChange={setNewListId}>
                <SelectTrigger className="flex-1 sm:w-[180px]">
                  <SelectValue placeholder="Liste" />
                </SelectTrigger>
                <SelectContent>
                  {allLists.map((list) => (
                    <SelectItem key={list.id} value={list.id}>
                      {list.spaceName} / {list.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={newPriority} onValueChange={setNewPriority}>
                <SelectTrigger className="flex-1 sm:w-[120px]">
                  <SelectValue placeholder="Priorité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">Haute</SelectItem>
                  <SelectItem value="normal">Normale</SelectItem>
                  <SelectItem value="low">Basse</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleCreate}
                disabled={isSubmitting || !newTitle.trim() || !newListId}
                size="sm"
              >
                {isSubmitting ? "Création..." : "Créer"}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowForm(false)}
                className="shrink-0 h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          )}
        </div>
      )}
    </div>
  );
}
