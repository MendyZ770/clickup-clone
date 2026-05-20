/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFinanceGoals, useFinanceAccounts } from "@/hooks/use-finance";

export function AddGoalDialog({ open, onOpenChange, workspaceId }: any) {
  const { mutate } = useFinanceGoals(workspaceId);
  const { accounts } = useFinanceAccounts(workspaceId);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [deadline, setDeadline] = useState("");
  const [accountId, setAccountId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reset = () => {
    setName("");
    setDescription("");
    setTargetAmount("");
    setCurrency("EUR");
    setDeadline("");
    setAccountId("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !targetAmount || !workspaceId) return;

    setIsSubmitting(true);
    try {
      await fetch("/api/finance/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          targetAmount: parseFloat(targetAmount),
          currency,
          deadline: deadline || undefined,
          workspaceId,
          accountId: accountId || undefined,
        }),
      });
      mutate();
      reset();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvel objectif d&apos;épargne</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nom</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Voiture" />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optionnel..." />
          </div>

          <div className="space-y-2">
            <Label>Montant cible</Label>
            <Input type="number" step="0.01" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} placeholder="0.00" />
          </div>

          <div className="space-y-2">
            <Label>Devise</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EUR">EUR (€)</SelectItem>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="GBP">GBP (£)</SelectItem>
                <SelectItem value="CHF">CHF</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Date butoir</Label>
            <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>

          {accounts.length > 0 && (
            <div className="space-y-2">
              <Label>Compte lié (optionnel)</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un compte" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Aucun</SelectItem>
                  {accounts.map((a: any) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting || !name || !targetAmount}>
              {isSubmitting ? "Création..." : "Créer l'objectif"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
