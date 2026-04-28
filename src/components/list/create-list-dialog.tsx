"use client";

import { useState } from "react";
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
import { SIDEBAR_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface CreateListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  spaceId: string;
  folderId?: string;
  onCreated?: () => void;
}

export function CreateListDialog({
  open,
  onOpenChange,
  spaceId,
  folderId,
  onCreated,
}: CreateListDialogProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          color: color || undefined,
          spaceId,
          folderId: folderId || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create list");
      }

      onOpenChange(false);
      resetForm();
      onCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setColor(undefined);
    setError("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        onOpenChange(val);
        if (!val) resetForm();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Créer une liste</DialogTitle>
          <DialogDescription>
            Les listes contiennent vos tâches. Les statuts par défaut seront créés automatiquement.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="list-name">Nom</Label>
            <Input
              id="list-name"
              placeholder="Backlog, Tâches Sprint..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Couleur (optionnel)</Label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setColor(undefined)}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border-2 border-dashed transition-all",
                  !color
                    ? "border-primary text-primary"
                    : "border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground"
                )}
              >
                <span className="text-xs">-</span>
              </button>
              {SIDEBAR_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "h-7 w-7 rounded-full transition-all",
                    color === c
                      ? "ring-2 ring-white ring-offset-2 ring-offset-background"
                      : "hover:scale-110"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {isLoading ? "Création..." : "Créer la liste"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
