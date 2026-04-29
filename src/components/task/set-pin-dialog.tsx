"use client";

import { useState, useRef, useEffect } from "react";
import { Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SetPinDialogProps {
  open: boolean;
  onConfirm: (pin: string) => void;
  onCancel: () => void;
}

export function SetPinDialog({ open, onConfirm, onCancel }: SetPinDialogProps) {
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setPin("");
      setConfirm("");
      setError("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) {
      setError("Le code doit contenir 4 chiffres.");
      return;
    }
    if (pin !== confirm) {
      setError("Les codes ne correspondent pas.");
      return;
    }
    onConfirm(pin);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent className="sm:max-w-xs" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-amber-500" />
            Définir un code
          </DialogTitle>
          <DialogDescription>
            Choisissez un code à 4 chiffres pour protéger cette tâche.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Code (4 chiffres)</label>
            <Input
              ref={inputRef}
              type="password"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, "").slice(0, 4));
                setError("");
              }}
              placeholder="••••"
              className="text-center text-xl tracking-[0.5em] font-mono"
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Confirmer le code</label>
            <Input
              type="password"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value.replace(/\D/g, "").slice(0, 4));
                setError("");
              }}
              placeholder="••••"
              className="text-center text-xl tracking-[0.5em] font-mono"
              autoComplete="new-password"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onCancel}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={pin.length !== 4 || confirm.length !== 4}
            >
              Verrouiller
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
