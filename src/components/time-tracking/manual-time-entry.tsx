"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useTimerActions } from "@/hooks/use-time-entries";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";

interface ManualTimeEntryProps {
  taskId: string;
  onCreated?: () => void;
}

export function ManualTimeEntry({ taskId, onCreated }: ManualTimeEntryProps) {
  const { createManualEntry } = useTimerActions();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [hours, setHours] = useState("0");
  const [minutes, setMinutes] = useState("30");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [billable, setBillable] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;
    const totalSeconds = h * 3600 + m * 60;

    if (totalSeconds <= 0) {
      toast({
        title: "Durée invalide",
        description: "Veuillez entrer une durée supérieure à 0.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const startTime = new Date(`${date}T09:00:00`);
      const endTime = new Date(startTime.getTime() + totalSeconds * 1000);

      await createManualEntry({
        taskId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: totalSeconds,
        description: description || undefined,
        billable,
      });

      toast({ title: "Temps enregistré" });
      setOpen(false);
      setHours("0");
      setMinutes("30");
      setDescription("");
      setBillable(false);
      onCreated?.();
    } catch (err) {
      toast({
        title: "Erreur",
        description:
          err instanceof Error ? err.message : "Impossible d'enregistrer le temps",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
          <Plus className="h-3 w-3" />
          Saisir le temps
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Saisie manuelle du temps</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-3">
            <div className="space-y-1.5 flex-1">
              <Label htmlFor="hours">Heures</Label>
              <Input
                id="hours"
                type="number"
                min="0"
                max="24"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
              />
            </div>
            <div className="space-y-1.5 flex-1">
              <Label htmlFor="minutes">Minutes</Label>
              <Input
                id="minutes"
                type="number"
                min="0"
                max="59"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description (optionnel)</Label>
            <Input
              id="description"
              placeholder="Sur quoi avez-vous travaillé ?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="billable"
              checked={billable}
              onCheckedChange={(checked) => setBillable(checked === true)}
            />
            <Label htmlFor="billable" className="text-sm font-normal">
              Facturable
            </Label>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
