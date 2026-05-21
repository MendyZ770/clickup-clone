"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
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
import { useWorkspace } from "@/hooks/use-workspace";
import { SIDEBAR_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/components/ui/animated-container";

interface CreateWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateWorkspaceDialog({
  open,
  onOpenChange,
}: CreateWorkspaceDialogProps) {
  const router = useRouter();
  const { setCurrentWorkspace } = useWorkspace();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState<string>(SIDEBAR_COLORS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined, color }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create workspace");
      }

      const workspace = await res.json();
      setCurrentWorkspace(workspace);
      onOpenChange(false);
      resetForm();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setColor(SIDEBAR_COLORS[0]);
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
          <DialogTitle>{"Créer un espace de travail"}</DialogTitle>
          <DialogDescription>
            {"Un espace de travail est un environnement partagé pour votre équipe."}
          </DialogDescription>
        </DialogHeader>

        <motion.form
          onSubmit={handleSubmit}
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          <motion.div variants={staggerItem} className="space-y-2">
            <Label htmlFor="ws-name">Nom</Label>
            <Input
              id="ws-name"
              placeholder="Mon espace de travail"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
          </motion.div>

          <motion.div variants={staggerItem} className="space-y-2">
            <Label htmlFor="ws-desc">Description (optionnel)</Label>
            <Textarea
              id="ws-desc"
              placeholder="À quoi sert cet espace de travail ?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
              rows={2}
            />
          </motion.div>

          <motion.div variants={staggerItem} className="space-y-2">
            <Label>Couleur</Label>
            <motion.div className="flex flex-wrap gap-2">
              {SIDEBAR_COLORS.map((c) => (
                <motion.button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "h-8 w-8 rounded-full transition-all",
                    color === c
                      ? "ring-2 ring-white ring-offset-2 ring-offset-background"
                      : ""
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </motion.div>
          </motion.div>

          {error && (
            <motion.p variants={staggerItem} className="text-sm text-destructive">{error}</motion.p>
          )}

          <DialogFooter>
            <motion.div variants={staggerItem} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Annuler
              </Button>
            </motion.div>
            <motion.div variants={staggerItem} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button type="submit" disabled={isLoading || !name.trim()}>
                {isLoading ? "Création..." : "Créer"}
              </Button>
            </motion.div>
          </DialogFooter>
        </motion.form>
      </DialogContent>
    </Dialog>
  );
}
