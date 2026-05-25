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
import { revalidateFinance } from "@/lib/swr-config";

const ACCOUNT_TYPES = [
  { value: "bank", label: "Compte bancaire" },
  { value: "cash", label: "Espèces" },
  { value: "crypto", label: "Crypto" },
  { value: "savings", label: "Épargne" },
  { value: "investment", label: "Investissement" },
  { value: "other", label: "Autre" },
];

interface AddAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId?: string;
}

export function AddAccountDialog({ open, onOpenChange, workspaceId }: AddAccountDialogProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [bankName, setBankName] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [balance, setBalance] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reset = () => {
    setName("");
    setType("");
    setBankName("");
    setCurrency("EUR");
    setBalance("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !type || !workspaceId) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/finance/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          type,
          bankName: type === "bank" ? bankName : undefined,
          currency,
          balance: parseFloat(balance) || 0,
          workspaceId,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error || "Failed to create account");
      }
      await revalidateFinance(workspaceId);
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
          <DialogTitle>Nouveau compte</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nom du compte</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Compte Courant BNP" />
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un type" />
              </SelectTrigger>
              <SelectContent>
                {ACCOUNT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {type === "bank" && (
            <div className="space-y-2">
              <Label>Nom de la banque</Label>
              <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Ex: BNP Paribas" />
            </div>
          )}

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
                <SelectItem value="BTC">BTC (₿)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Solde initial</Label>
            <Input type="number" step="0.01" value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="0.00" />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting || !name || !type}>
              {isSubmitting ? "Création..." : "Créer le compte"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
