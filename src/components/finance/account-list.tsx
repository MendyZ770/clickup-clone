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
import { Banknote, Bitcoin, PiggyBank, Landmark, CreditCard, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

const TYPE_ICONS: Record<string, any> = {
  bank: Landmark,
  cash: Banknote,
  crypto: Bitcoin,
  savings: PiggyBank,
  investment: TrendingUpIcon,
  other: CreditCard,
};

function TrendingUpIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
  );
}

export function FinanceAccountList({ accounts, onMutate }: { accounts: any[]; onMutate?: () => void }) {
  const [editing, setEditing] = useState<any>(null);

  if (accounts.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="py-12 text-center text-muted-foreground">
          Aucun compte. Créez votre premier compte pour commencer.
        </CardContent>
      </Card>
    );
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce compte et toutes ses transactions ?")) return;
    try {
      await fetch(`/api/finance/accounts/${id}`, { method: "DELETE" });
      onMutate?.();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((account: any) => {
          const Icon = TYPE_ICONS[account.type] || CreditCard;
          return (
            <Card key={account.id} className="overflow-hidden border-border/50 hover:shadow-lg transition-shadow group">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full"
                      style={{ backgroundColor: account.color + "20" }}
                    >
                      <Icon className="h-5 w-5" style={{ color: account.color }} />
                    </div>
                    <div>
                      <p className="font-medium">{account.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {account.type === "bank" && account.bankName
                          ? `${account.bankName} • `
                          : ""}
                        {account.type}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditing(account)}>
                        <Pencil className="h-3.5 w-3.5 mr-2" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(account.id)} className="text-red-500 focus:text-red-500">
                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold">
                    {account.balance.toLocaleString("fr-FR", {
                      style: "currency",
                      currency: account.currency,
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {account._count?.transactions || 0} transaction
                    {(account._count?.transactions || 0) > 1 ? "s" : ""}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Dialog */}
      {editing && (
        <EditAccountDialog
          account={editing}
          open={!!editing}
          onOpenChange={() => setEditing(null)}
          onMutate={onMutate}
        />
      )}
    </>
  );
}

function EditAccountDialog({ account, open, onOpenChange, onMutate }: any) {
  const [name, setName] = useState(account.name);
  const [bankName, setBankName] = useState(account.bankName || "");
  const [balance, setBalance] = useState(String(account.balance));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setIsSubmitting(true);
    try {
      await fetch(`/api/finance/accounts/${account.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bankName: bankName || undefined, balance: parseFloat(balance) }),
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
        <h3 className="font-semibold mb-4">Modifier le compte</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nom</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full h-10 rounded-md border bg-transparent px-3 text-sm" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Banque</label>
            <input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Ex: BNP, Revolut..." className="w-full h-10 rounded-md border bg-transparent px-3 text-sm" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Solde</label>
            <input type="number" step="0.01" value={balance} onChange={(e) => setBalance(e.target.value)} className="w-full h-10 rounded-md border bg-transparent px-3 text-sm" />
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
