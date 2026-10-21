"use client";

import { useState, useRef, useEffect } from "react";
import { Lock, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiJson, apiErrorMessage } from "@/lib/api-client";

interface PinDialogProps {
  open: boolean;
  taskId: string;
  onSuccess: (pin: string) => void;
  onCancel: () => void;
}

export function PinDialog({ open, taskId, onSuccess, onCancel }: PinDialogProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setPin("");
      setError("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (pin.length !== 4 || loading) return;

    setLoading(true);
    setError("");
    try {
      const data = await apiJson<{ valid?: boolean }>(`/api/tasks/${taskId}/verify-pin`, {
        method: "POST",
        body: JSON.stringify({ pin }),
      });
      if (data?.valid) {
        onSuccess(pin);
      } else {
        setError("Code incorrect. Réessayez.");
        setPin("");
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    } catch (error) {
      setError(apiErrorMessage(error));
      toast({ title: "Vérification impossible", description: apiErrorMessage(error), variant: "destructive" });
      setPin("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent className="sm:max-w-xs" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-amber-500" />
            Tâche verrouillée
          </DialogTitle>
          <DialogDescription>
            Entrez le code à 4 chiffres pour accéder à cette tâche.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <Input
            ref={inputRef}
            type="password"
            inputMode="numeric"
            pattern="\d{4}"
            maxLength={4}
            value={pin}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 4);
              setPin(val);
              setError("");
              if (val.length === 4) {
                // Auto-submit quand 4 chiffres
                setTimeout(() => {
                  const form = e.target.closest("form");
                  form?.requestSubmit();
                }, 100);
              }
            }}
            placeholder="••••"
            className="text-center text-xl tracking-[0.5em] font-mono"
            autoComplete="one-time-code"
          />

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onCancel}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={pin.length !== 4 || loading}
            >
              {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              Accéder
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
