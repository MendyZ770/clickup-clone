"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import useSWR from "swr";

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string | null;
  defaultListId?: string;
  onCreated?: () => void;
}

export function CreateTaskDialog({
  open,
  onOpenChange,
  workspaceId,
  defaultListId,
  onCreated,
}: CreateTaskDialogProps) {
  const { toast } = useToast();
  const { createTask } = useCreateTask();
  const { spaces } = useSpaces(workspaceId ?? null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [listId, setListId] = useState(defaultListId ?? "");
  const [priority, setPriority] = useState("normal");
  const [assigneeId, setAssigneeId] = useState("unassigned");
  const [submitting, setSubmitting] = useState(false);

  const { data: members } = useSWR<{ user: { id: string, name: string | null, email: string, image: string | null } }[]>(
    workspaceId ? `/api/workspaces/${workspaceId}/members` : null,
    (url: string) => fetch(url).then((r) => r.json())
  );

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
    if (!open) return;
    if (defaultListId) {
      setListId(defaultListId);
    } else if (allLists.length > 0 && !listId) {
      setListId(allLists[0].id);
    }
  }, [open, allLists, listId, defaultListId]);

  const reset = () => {
    setTitle("");
    setDescription("");
    setPriority("normal");
    setAssigneeId("unassigned");
    setListId(defaultListId ?? "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || !listId) return;

    setSubmitting(true);
    try {
      await createTask({
        title: trimmed,
        listId,
        priority,
        description: description.trim() || undefined,
        assigneeId: assigneeId !== "unassigned" ? assigneeId : undefined,
      });
      toast({ title: "Tâche créée" });
      reset();
      onOpenChange(false);
      onCreated?.();
    } catch (err) {
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Impossible de créer la tâche",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        onOpenChange(val);
        if (!val) reset();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvelle tâche</DialogTitle>
          <DialogDescription>
            Ajoutez une tâche dans une de vos listes.
          </DialogDescription>
        </DialogHeader>

        {allLists.length === 0 ? (
          <div className="py-2 space-y-3">
            <p className="text-sm">Aucune liste disponible.</p>
            <p className="text-xs text-muted-foreground">
              Créez d&apos;abord un espace puis une liste avant d&apos;ajouter des tâches.
            </p>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fermer
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">Titre</Label>
              <Input
                id="task-title"
                placeholder="Que faut-il faire ?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={submitting}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-desc">Description (optionnel)</Label>
              <Textarea
                id="task-desc"
                placeholder="Plus de détails..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={submitting}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Liste</Label>
                <Select value={listId} onValueChange={setListId} disabled={submitting}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une liste" />
                  </SelectTrigger>
                  <SelectContent>
                    {allLists.map((list) => (
                      <SelectItem key={list.id} value={list.id}>
                        {list.spaceName} / {list.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Assigné à</Label>
                <Select value={assigneeId} onValueChange={setAssigneeId} disabled={submitting}>
                  <SelectTrigger>
                    <SelectValue placeholder="Non assigné" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Non assigné</SelectItem>
                    {members?.map((m) => (
                      <SelectItem key={m.user.id} value={m.user.id}>
                        {m.user.name ?? m.user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priorité</Label>
                <Select value={priority} onValueChange={setPriority} disabled={submitting}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">Urgente</SelectItem>
                    <SelectItem value="high">Haute</SelectItem>
                    <SelectItem value="normal">Normale</SelectItem>
                    <SelectItem value="low">Basse</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={submitting || !title.trim() || !listId}>
                {submitting ? "Création..." : "Créer la tâche"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
