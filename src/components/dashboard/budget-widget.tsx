"use client";

import Link from "next/link";
import { Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import type { BudgetWithTransactions } from "@/types";

interface BudgetWidgetProps {
  budgets: BudgetWithTransactions[];
  isLoading: boolean;
}

export function BudgetWidget({ budgets, isLoading }: BudgetWidgetProps) {
  if (isLoading) {
    return (
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
    );
  }

  const topBudgets = budgets.slice(0, 3);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Wallet className="h-5 w-5 text-muted-foreground" />
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
          topBudgets.map((budget) => {
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
              <Link key={budget.id} href={`/budget/${budget.id}`} className="block">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium truncate">{budget.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {percentUsed.toFixed(0)}%
                    </span>
                  </div>
                  <Progress
                    value={percentUsed}
                    className="h-2.5"
                  />
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
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
