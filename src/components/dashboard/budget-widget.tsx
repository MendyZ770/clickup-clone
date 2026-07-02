"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import type { BudgetWithTransactions } from "@/types";
import { staggerContainer, staggerItem } from "@/components/ui/animated-container";

interface BudgetWidgetProps {
  budgets: BudgetWithTransactions[];
  isLoading: boolean;
}

export function BudgetWidget({ budgets, isLoading }: BudgetWidgetProps) {
  if (isLoading) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="rounded-[2rem] border border-border/30 bg-card/40 backdrop-blur-xl p-6 space-y-4 shadow-sm h-full flex flex-col">
          <Skeleton className="h-5 w-32" />
          <div className="space-y-4 mt-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  const topBudgets = budgets.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className="h-full"
    >
      <div className="relative overflow-hidden rounded-[2rem] border border-border/30 bg-card/40 backdrop-blur-xl p-6 shadow-xl shadow-black/5 hover:shadow-2xl transition-all duration-500 group h-full flex flex-col">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        <div className="flex items-center justify-between mb-6 relative z-10">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Wallet className="h-5 w-5 text-muted-foreground" />
            Budgets actifs
          </h3>
          <Link
            href="/budget"
            className="text-sm text-primary hover:underline"
          >
            Voir tout
          </Link>
        </div>
        <div className="space-y-4 relative z-10 flex-grow">
          {topBudgets.length === 0 ? (
            <div className="rounded-[2rem] border border-border/20 bg-card/40 p-5 flex flex-col items-center justify-center h-full shadow-inner">
              <Wallet className="h-9 w-9 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground font-medium">Aucun budget</p>
            </div>
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="space-y-4"
            >
              {topBudgets.map((budget) => {
                const totalExpense = budget.transactions
                  .filter((t) => t.type === "expense")
                  .reduce((sum, t) => sum + t.amount, 0);
                const totalIncome = budget.transactions
                  .filter((t) => t.type === "income")
                  .reduce((sum, t) => sum + t.amount, 0);
                const netSpent = totalExpense - totalIncome;
                const percentUsed =
                  budget.amount > 0 ? Math.min((netSpent / budget.amount) * 100, 100) : 0;

                return (
                  <motion.div
                    key={budget.id}
                    variants={staggerItem}
                    whileHover={{ x: 2 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <Link href={`/budget/${budget.id}`} className="block">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium truncate">{budget.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {percentUsed.toFixed(0)}%
                          </span>
                        </div>
                        <motion.div
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          style={{ originX: 0 }}
                        >
                          <Progress
                            value={percentUsed}
                            className="h-2.5"
                          />
                        </motion.div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>
                            {netSpent.toLocaleString("fr-FR", {
                              style: "currency",
                              currency: budget.currency,
                            })}{" "}
                            utilisé
                          </span>
                          <span>
                            {budget.amount.toLocaleString("fr-FR", {
                              style: "currency",
                              currency: budget.currency,
                            })}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
