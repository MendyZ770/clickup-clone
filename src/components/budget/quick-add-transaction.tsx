"use client";

import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { CategorySelect } from "./category-select";
import { useBudgets } from "@/hooks/use-budgets";
import { useWorkspace } from "@/hooks/use-workspace";
import { useSWRConfig } from "swr";
import { ArrowLeft, Wallet } from "lucide-react";

const transactionSchema = z.object({
  amount: z.number().positive("Le montant doit être positif"),
  type: z.enum(["income", "expense"]),
  description: z.string().optional(),
  date: z.string().min(1, "La date est requise"),
  categoryId: z.string().optional(),
});

interface QuickAddTransactionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickAddTransaction({ open, onOpenChange }: QuickAddTransactionProps) {
  const { currentWorkspace } = useWorkspace();
  const { budgets } = useBudgets(currentWorkspace?.id);
  const { mutate } = useSWRConfig();

  const [step, setStep] = useState<"select" | "form">("select");
  const [selectedBudgetId, setSelectedBudgetId] = useState<string>("");

  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [categoryId, setCategoryId] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setStep("select");
    setSelectedBudgetId("");
    setAmount("");
    setType("expense");
    setDescription("");
    setDate(new Date().toISOString().slice(0, 10));
    setCategoryId("");
    setErrors({});
    setIsSubmitting(false);
  };

  const handleClose = (val: boolean) => {
    if (!val) resetForm();
    onOpenChange(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsed = transactionSchema.safeParse({
      amount: parseFloat(amount),
      type,
      description: description || undefined,
      date: new Date(date).toISOString(),
      categoryId: categoryId && categoryId !== "__none__" ? categoryId : undefined,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        if (issue.path[0]) fieldErrors[issue.path[0] as string] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/budget/${selectedBudgetId}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) throw new Error("Erreur lors de l&apos;ajout");

      // Invalidate related caches
      mutate(`/api/budget/${selectedBudgetId}`);
      mutate(`/api/budget/stats?budgetId=${selectedBudgetId}`);
      mutate(`/api/budget?workspaceId=${currentWorkspace?.id}`);

      resetForm();
      onOpenChange(false);
    } catch {
      setErrors({ amount: "Erreur lors de l&apos;ajout de la transaction" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === "select" ? "Choisir un budget" : "Nouvelle transaction"}
          </DialogTitle>
        </DialogHeader>

        {step === "select" ? (
          <div className="space-y-3 py-2">
            {budgets.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucun budget. Créez-en un d&apos;abord dans la page Budget.
              </p>
            ) : (
              budgets.map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    setSelectedBudgetId(b.id);
                    setStep("form");
                  }}
                  className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent"
                >
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-full"
                    style={{ backgroundColor: b.color + "20" }}
                  >
                    <Wallet className="h-5 w-5" style={{ color: b.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{b.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {b.amount.toLocaleString("fr-FR", {
                        style: "currency",
                        currency: b.currency,
                      })}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <button
              type="button"
              onClick={() => setStep("select")}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Changer de budget
            </button>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as "income" | "expense")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Revenu</SelectItem>
                  <SelectItem value="expense">Dépense</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quick-amount">Montant</Label>
              <Input
                id="quick-amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                autoFocus
              />
              {errors.amount && <p className="text-xs text-red-500">{errors.amount}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="quick-date">Date</Label>
              <Input
                id="quick-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            {currentWorkspace?.id && (
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <CategorySelect
                  workspaceId={currentWorkspace.id}
                  value={categoryId}
                  onChange={setCategoryId}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="quick-desc">Description</Label>
              <Textarea
                id="quick-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description optionnelle..."
                rows={2}
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Ajout..." : "Ajouter"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
