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
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
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
    >
      <Card className="hover:shadow-md transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <motion.div whileHover={{ rotate: 10 }} transition={{ type: "spring", stiffness: 300, damping: 15 }}>
              <Wallet className="h-5 w-5 text-muted-foreground" />
            </motion.div>
            Budgets actifs
          </CardTitle>
          <Link
            href="/budget"
            className="text-sm text-primary hover:underline"
          >
            Voir tout
          </Link>
        </CardHeader>
        <CardContent className="space-y-4">
          {topBudgets.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucun budget
            </p>
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
        </CardContent>
      </Card>
    </motion.div>
  );
}
