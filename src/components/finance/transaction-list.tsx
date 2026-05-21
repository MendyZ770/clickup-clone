/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TrendingUp, TrendingDown, ArrowRightLeft, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

export function FinanceTransactionList({ transactions, accounts, onMutate }: { transactions: any[]; accounts: any[]; onMutate?: () => void }) {
  const [editing, setEditing] = useState<any>(null);

  if (transactions.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="py-12 text-center text-muted-foreground">
          Aucune transaction. Ajoutez votre première transaction.
        </CardContent>
      </Card>
    );
  }

  const getAccountName = (id: string) => accounts.find((a: any) => a.id === id)?.name || id;

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette transaction ?")) return;
    try {
      await fetch(`/api/finance/transactions/${id}`, { method: "DELETE" });
      onMutate?.();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Card className="border-border/50 overflow-hidden">
      <CardContent className="p-0">
        <div className="divide-y divide-border/40">
          {transactions.map((t: any) => (
            <div key={t.id} className="flex items-center justify-between p-4 hover:bg-muted/40 transition-colors group">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full ${
                    t.type === "income"
                      ? "bg-emerald-500/10 text-emerald-500"
                      : t.type === "expense"
                      ? "bg-rose-500/10 text-rose-500"
                      : "bg-blue-500/10 text-blue-500"
                  }`}
                >
                  {t.type === "income" ? (
                    <TrendingUp className="h-5 w-5" />
                  ) : t.type === "expense" ? (
                    <TrendingDown className="h-5 w-5" />
                  ) : (
                    <ArrowRightLeft className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm">{t.description || "Sans description"}</p>
                  <p className="text-sm text-muted-foreground">
                    {getAccountName(t.accountId)}
                    {t.category && ` • ${t.category.name}`}
                    {t.isRecurring && ` • 🔁 ${t.recurringFrequency === "monthly" ? "mensuel" : t.recurringFrequency === "weekly" ? "hebdo" : "annuel"}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p
                    className={`font-semibold ${
                      t.type === "income"
                        ? "text-emerald-600"
                        : t.type === "expense"
                        ? "text-rose-600"
                        : "text-blue-600"
                    }`}
                  >
                    {t.type === "income" ? "+" : t.type === "expense" ? "-" : ""}
                    {t.amount.toLocaleString("fr-FR", {
                      style: "currency",
                      currency: t.account?.currency || "EUR",
                    })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(t.date).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditing(t)}>
                      <Pencil className="h-5 w-5 mr-2" />
                      Modifier
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(t.id)} className="text-red-500 focus:text-red-500">
                      <Trash2 className="h-5 w-5 mr-2" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      {/* Inline Edit Dialog */}
      {editing && (
        <EditTransactionDialog
          transaction={editing}
          accounts={accounts}
          open={!!editing}
          onOpenChange={() => setEditing(null)}
          onMutate={onMutate}
        />
      )}
    </Card>
  );
}

function EditTransactionDialog({ transaction, open, onOpenChange, onMutate }: any) {
  const [amount, setAmount] = useState(String(transaction.amount));
  const [description, setDescription] = useState(transaction.description || "");
  const [date, setDate] = useState(new Date(transaction.date).toISOString().slice(0, 10));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    setIsSubmitting(true);
    try {
      await fetch(`/api/finance/transactions/${transaction.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseFloat(amount), description, date }),
      });
      onMutate?.();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 ${open ? "flex" : "hidden"} items-center justify-center bg-black/50`} onClick={() => onOpenChange(false)}>
      <div className="bg-card border rounded-xl p-6 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-semibold mb-4">Modifier la transaction</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Montant</label>
            <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full h-10 rounded-md border bg-transparent px-3 text-sm" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} className="w-full h-10 rounded-md border bg-transparent px-3 text-sm" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full h-10 rounded-md border bg-transparent px-3 text-sm" />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => onOpenChange(false)} className="px-4 py-2 text-sm rounded-md border hover:bg-muted transition-colors">Annuler</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">Enregistrer</button>
          </div>
        </form>
      </div>
    </div>
  );
}
