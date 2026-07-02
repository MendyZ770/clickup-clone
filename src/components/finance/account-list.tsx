"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Banknote, Bitcoin, PiggyBank, Landmark, CreditCard, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { staggerContainer, staggerItem } from "@/components/ui/animated-container";
import { formatCurrency } from "@/lib/utils";

const TYPE_ICONS: Record<string, React.ElementType> = {
  bank: Landmark,
  cash: Banknote,
  crypto: Bitcoin,
  savings: PiggyBank,
  investment: TrendingUpIcon,
  other: CreditCard,
};

function TrendingUpIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
  );
}

type FinanceAccountWithCount = import("@prisma/client").FinanceAccount & {
  _count?: { transactions: number };
};

export function FinanceAccountList({ accounts, onMutate }: { accounts: FinanceAccountWithCount[]; onMutate?: () => void }) {
  const [editing, setEditing] = useState<FinanceAccountWithCount | null>(null);

  if (accounts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-border/50">
          <CardContent className="py-12 text-center text-muted-foreground">
            Aucun compte. Créez votre premier compte pour commencer.
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce compte et toutes ses transactions ?")) return;
    try {
      const res = await fetch(`/api/finance/accounts/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error || "Failed to delete account");
      }
      onMutate?.();
    } catch (error) {
      console.error(error);
    }
  };

  const groupedAccounts = accounts.reduce((acc, account) => {
    const bank = account.bankName || "Comptes Manuels";
    if (!acc[bank]) acc[bank] = [];
    acc[bank].push(account);
    return acc;
  }, {} as Record<string, FinanceAccountWithCount[]>);

  return (
    <div className="space-y-8">
      {Object.entries(groupedAccounts).map(([bank, bankAccounts]) => (
        <div key={bank} className="space-y-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Landmark className="h-5 w-5 text-muted-foreground" />
            {bank}
          </h3>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {bankAccounts.map((account) => {
              const Icon = TYPE_ICONS[account.type] || CreditCard;
              return (
                <motion.div key={account.id} variants={staggerItem} whileHover={{ y: -3 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>
                <Card className="overflow-hidden border-border/50 hover:shadow-lg transition-shadow duration-300 group relative">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <motion.div
                          className="flex h-10 w-10 items-center justify-center rounded-full"
                          style={{ backgroundColor: account.color + "20" }}
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ type: "spring", stiffness: 300, damping: 15 }}
                        >
                          <Icon className="h-7 w-7" style={{ color: account.color }} />
                        </motion.div>
                        <div>
                          <p className="font-medium truncate max-w-[150px]" title={account.name}>{account.name}</p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {account.type}
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2"
                          >
                            <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
                          </motion.button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditing(account)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(account.id)} className="text-red-500 focus:text-red-500">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="mt-4">
                      <p className="text-2xl font-bold">
                        {formatCurrency(account.balance, account.currency)}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {account._count?.transactions || 0} transaction
                        {(account._count?.transactions || 0) > 1 ? "s" : ""}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      ))}

      {/* Edit Dialog */}
      {editing && (
        <EditAccountDialog
          account={editing}
          open={!!editing}
          onOpenChange={() => setEditing(null)}
          onMutate={onMutate}
        />
      )}
    </div>
  );
}

function EditAccountDialog({ account, open, onOpenChange, onMutate }: { account: FinanceAccountWithCount; open: boolean; onOpenChange: (open: boolean) => void; onMutate?: () => void }) {
  const [name, setName] = useState(account.name);
  const [bankName, setBankName] = useState(account.bankName || "");
  const [balance, setBalance] = useState(String(account.balance));
  const [currency, setCurrency] = useState(account.currency || "EUR");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/finance/accounts/${account.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bankName: bankName || undefined, balance: parseFloat(balance), currency }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error || "Failed to update account");
      }
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
            <label className="text-sm font-medium">Banque (Groupe)</label>
            <input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Ex: Revolut" className="w-full h-10 rounded-md border bg-transparent px-3 text-sm" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Devise</label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full h-10 rounded-md border bg-background px-3 text-sm">
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
              <option value="GBP">GBP (£)</option>
              <option value="CHF">CHF</option>
              <option value="ILS">ILS (₪)</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Solde initial</label>
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
