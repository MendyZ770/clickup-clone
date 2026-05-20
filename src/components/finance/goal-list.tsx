/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Target, CheckCircle2, TrendingUp, Plus } from "lucide-react";

const QUICK_AMOUNTS = [10, 50, 100, 500];

export function FinanceGoalList({ goals, onMutate }: { goals: any[]; onMutate?: () => void }) {
  const [contributingId, setContributingId] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContribute = async (goalId: string, amount: number) => {
    if (!amount || amount <= 0) return;
    setIsSubmitting(true);
    try {
      await fetch(`/api/finance/goals/${goalId}/contribute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
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
          <p className="text-xs mt-1">Créez votre premier objectif d&apos;épargne</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {goals.map((goal: any, i: number) => {
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
                        <CheckCircle2 className="h-5 w-5" style={{ color: goal.color || "#F59E0B" }} />
                      ) : (
                        <Target className="h-5 w-5" style={{ color: goal.color || "#F59E0B" }} />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{goal.name}</p>
                      {goal.account && (
                        <p className="text-[11px] text-muted-foreground">{goal.account.name}</p>
                      )}
                    </div>
                  </div>
                  {goal.deadline && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {new Date(goal.deadline).toLocaleDateString("fr-FR")}
                    </span>
                  )}
                </div>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      {goal.currentAmount.toLocaleString("fr-FR", { style: "currency", currency: goal.currency })}
                    </span>
                    <span className="font-semibold">
                      {goal.targetAmount.toLocaleString("fr-FR", { style: "currency", currency: goal.currency })}
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 1, delay: 0.2 }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground text-center font-medium">
                    {Math.round(progress)}% atteint
                  </p>
                </div>

                {/* Quick contribute */}
                {!isContributing ? (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs flex-1 gap-1"
                      onClick={() => setContributingId(goal.id)}
                    >
                      <Plus className="h-3 w-3" />
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
                          className="h-7 text-xs flex-1"
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
                        className="h-7 text-xs"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleContribute(goal.id, parseFloat(customAmount) || 0);
                        }}
                      />
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        disabled={isSubmitting || !customAmount}
                        onClick={() => handleContribute(goal.id, parseFloat(customAmount) || 0)}
                      >
                        <TrendingUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs px-2"
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
  );
}
