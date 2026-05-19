"use client";

import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CategoryBadge } from "./category-badge";
import type { BudgetTransactionWithCategory } from "@/types";

interface TransactionItemProps {
  transaction: BudgetTransactionWithCategory;
}

export function TransactionItem({ transaction }: TransactionItemProps) {
  const isIncome = transaction.type === "income";

  return (
    <div className="flex items-center justify-between rounded-lg border bg-card p-3 hover:bg-muted/40 transition-colors">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-full ${
            isIncome ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
          }`}
        >
          {isIncome ? (
            <ArrowDownLeft className="h-4 w-4" />
          ) : (
            <ArrowUpRight className="h-4 w-4" />
          )}
        </div>
        <div className="space-y-0.5">
          <p className="text-sm font-medium">
            {transaction.description || (isIncome ? "Revenu" : "Dépense")}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>
              {format(new Date(transaction.date), "dd MMM yyyy", { locale: fr })}
            </span>
            {transaction.category && (
              <CategoryBadge
                name={transaction.category.name}
                color={transaction.category.color}
              />
            )}
          </div>
        </div>
      </div>
      <span
        className={`text-sm font-semibold ${
          isIncome ? "text-emerald-600" : "text-red-600"
        }`}
      >
        {isIncome ? "+" : "-"}
        {transaction.amount.toLocaleString("fr-FR", {
          style: "currency",
          currency: "EUR",
        })}
      </span>
    </div>
  );
}
