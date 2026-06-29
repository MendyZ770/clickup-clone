"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Target, CheckCircle2, TrendingUp, Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

const QUICK_AMOUNTS = [10, 50, 100, 500];

type GoalWithAccount = import("@prisma/client").FinanceGoal & { account?: { name: string } | null };

export function FinanceGoalList({ goals, onMutate }: { goals: GoalWithAccount[]; onMutate?: () => void }) {
  const [contributingId, setContributingId] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editing, setEditing] = useState<GoalWithAccount | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cet objectif ?")) return;
    try {
      const res = await fetch(`/api/finance/goals/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error || "Failed to delete goal");
      }
      onMutate?.();
    } catch (error) {
      console.error(error);
    }
  };

  const handleContribute = async (goalId: string, amount: number) => {
    if (!amount || amount <= 0) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/finance/goals/${goalId}/contribute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error || "Failed to contribute");
      }
      setContributingId(null);
      setCustomAmount("");
      onMutate?.();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (goals.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="py-12 text-center text-muted-foreground">
          <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
            <Target className="h-6 w-6 text-amber-500" />
          </div>
          <p className="font-medium">Aucun objectif</p>
          <p className="text-sm mt-1">Créez votre premier objectif d&apos;épargne</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {goals.map((goal, i) => {
        const progress = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;
        const isContributing = contributingId === goal.id;

        return (
          <motion.div
            key={goal.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
          >
            <Card className="border-border/50 bg-gradient-to-br from-background to-muted/10 overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{ backgroundColor: (goal.color || "#F59E0B") + "20" }}
                    >
                      {goal.isCompleted ? (
                        <CheckCircle2 className="h-6 w-6" style={{ color: goal.color || "#F59E0B" }} />
                      ) : (
                        <Target className="h-6 w-6" style={{ color: goal.color || "#F59E0B" }} />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{goal.name}</p>
                      {goal.account && (
                        <p className="text-sm text-muted-foreground">{goal.account.name}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {goal.deadline && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground mr-1">
                        {new Date(goal.deadline).toLocaleDateString("fr-FR")}
                      </span>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted transition-colors">
                          <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditing(goal)}>
                          <Pencil className="h-5 w-5 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(goal.id)} className="text-red-500 focus:text-red-500">
                          <Trash2 className="h-5 w-5 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-2xl font-bold">
                      {formatCurrency(goal.currentAmount, goal.currency)}
                    </span>
                    <span className="text-sm text-muted-foreground font-medium">
                      sur {formatCurrency(goal.targetAmount, goal.currency)}
                    </span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 1, delay: 0.2 }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center font-medium">
                    {Math.round(progress)}% atteint
                  </p>
                </div>

                {/* Quick contribute */}
                {!isContributing ? (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 text-sm flex-1 gap-1"
                      onClick={() => setContributingId(goal.id)}
                    >
                      <Plus className="h-4 w-4" />
                      Contribuer
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-1.5">
                      {QUICK_AMOUNTS.map((amt) => (
                        <Button
                          key={amt}
                          variant="outline"
                          size="sm"
                          className="h-9 text-sm flex-1"
                          disabled={isSubmitting}
                          onClick={() => handleContribute(goal.id, amt)}
                        >
                          +{amt}€
                        </Button>
                      ))}
                    </div>
                    <div className="flex gap-1.5">
                      <Input
                        type="number"
                        placeholder="Montant perso..."
                        className="h-9 text-sm"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleContribute(goal.id, parseFloat(customAmount) || 0);
                        }}
                      />
                      <Button
                        size="sm"
                        className="h-9 text-sm"
                        disabled={isSubmitting || !customAmount}
                        onClick={() => handleContribute(goal.id, parseFloat(customAmount) || 0)}
                      >
                        <TrendingUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 text-sm px-2"
                        onClick={() => { setContributingId(null); setCustomAmount(""); }}
                      >
                        ✕
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>

    {editing && (
      <EditGoalDialog
        goal={editing}
        open={!!editing}
        onOpenChange={() => setEditing(null)}
        onMutate={onMutate}
      />
    )}
    </>
  );
}

function EditGoalDialog({ goal, open, onOpenChange, onMutate }: { goal: GoalWithAccount; open: boolean; onOpenChange: (open: boolean) => void; onMutate?: () => void }) {
  const [name, setName] = useState(goal.name);
  const [targetAmount, setTargetAmount] = useState(String(goal.targetAmount));
  const [currentAmount, setCurrentAmount] = useState(String(goal.currentAmount));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !targetAmount) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/finance/goals/${goal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          targetAmount: parseFloat(targetAmount),
          currentAmount: parseFloat(currentAmount),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error || "Failed to update goal");
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
        <h3 className="font-semibold mb-4">Modifier l&apos;objectif</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nom</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full h-10 rounded-md border bg-transparent px-3 text-sm" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Montant cible</label>
            <input type="number" step="0.01" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} className="w-full h-10 rounded-md border bg-transparent px-3 text-sm" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Montant actuel</label>
            <input type="number" step="0.01" value={currentAmount} onChange={(e) => setCurrentAmount(e.target.value)} className="w-full h-10 rounded-md border bg-transparent px-3 text-sm" />
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
