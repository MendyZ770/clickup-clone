"use client";

import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFinanceAccounts, useFinanceCategories } from "@/hooks/use-finance";
import { revalidateFinance } from "@/lib/swr-config";
import { toast } from "@/components/ui/use-toast";
import { apiJson, apiErrorMessage } from "@/lib/api-client";

interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId?: string;
}

export function AddTransactionDialog({ open, onOpenChange, workspaceId }: AddTransactionDialogProps) {
  const { accounts } = useFinanceAccounts(workspaceId);
  const { categories } = useFinanceCategories(workspaceId);

  const [type, setType] = useState<"income" | "expense" | "transfer">("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [accountId, setAccountId] = useState("");
  const [targetAccountId, setTargetAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [recurringFrequency, setRecurringFrequency] = useState("none");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reset = () => {
    setType("expense");
    setAmount("");
    setDescription("");
    setAccountId("");
    setTargetAccountId("");
    setCategoryId("");
    setDate(new Date().toISOString().slice(0, 10));
    setRecurringFrequency("none");
  };

  const filteredCategories = categories.filter((c) => {
    if (type === "transfer") return false;
    return c.type === type;
  });

  const sourceAccount = accounts.find((a) => a.id === accountId);
  const targetAccounts = accounts.filter(
    (a) => a.id !== accountId && (!sourceAccount || a.currency === sourceAccount.currency)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !accountId || !workspaceId) return;

    if (type === "transfer" && !targetAccountId) {
      toast({
        title: "Compte destinataire requis",
        description: "Sélectionnez le compte vers lequel transférer.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiJson("/api/finance/transactions", {
        method: "POST",
        body: JSON.stringify({
          amount: parseFloat(amount),
          type,
          description,
          accountId,
          categoryId: categoryId || undefined,
          date,
          isTransfer: type === "transfer",
          targetAccountId: type === "transfer" ? targetAccountId : undefined,
          isRecurring: recurringFrequency !== "none",
          recurringFrequency: recurringFrequency !== "none" ? recurringFrequency : undefined,
        }),
      });
      await revalidateFinance(workspaceId);
      reset();
      onOpenChange(false);
    } catch (error) {
      toast({ title: "Enregistrement impossible", description: apiErrorMessage(error), variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nouvelle transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => { setType(v as "income" | "expense" | "transfer"); setCategoryId(""); }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Revenu</SelectItem>
                <SelectItem value="expense">Dépense</SelectItem>
                <SelectItem value="transfer">Transfert</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Compte</Label>
            <Select value={accountId} onValueChange={(value) => {
              setAccountId(value);
              const nextSource = accounts.find((a) => a.id === value);
              const target = accounts.find((a) => a.id === targetAccountId);
              if (nextSource && target && target.currency !== nextSource.currency) {
                setTargetAccountId("");
              }
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un compte" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name} ({a.currency})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {type === "transfer" && (
            <div className="space-y-2">
              <Label>Vers le compte</Label>
              <Select value={targetAccountId} onValueChange={setTargetAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un compte" />
                </SelectTrigger>
                <SelectContent>
                  {targetAccounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name} ({a.currency})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {type !== "transfer" && filteredCategories.length > 0 && (
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Montant</Label>
            <Input type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Courses hebdomadaires" />
          </div>

          {type !== "transfer" && (
            <div className="space-y-2">
              <Label>Récurrence</Label>
              <Select value={recurringFrequency} onValueChange={setRecurringFrequency}>
                <SelectTrigger>
                  <SelectValue placeholder="Pas récurrente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Pas récurrente</SelectItem>
                  <SelectItem value="weekly">Hebdomadaire</SelectItem>
                  <SelectItem value="monthly">Mensuelle</SelectItem>
                  <SelectItem value="yearly">Annuelle</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting || !amount || !accountId}>
              {isSubmitting ? "Ajout..." : "Ajouter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
