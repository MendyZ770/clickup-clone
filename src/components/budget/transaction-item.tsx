"use client";

import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CategoryBadge } from "./category-badge";
import { Badge } from "@/components/ui/badge";
import type { BudgetTransactionWithCategory } from "@/types";

const SUBTYPE_LABELS: Record<string, string> = {
  salary: "Salaire",
  freelance: "Freelance",
  investment: "Investissements",
  refund: "Remboursement",
  gift: "Cadeau",
  other_income: "Autre revenu",
  rent: "Loyer",
  food: "Nourriture",
  transport: "Transport",
  health: "Santé",
  leisure: "Loisirs",
  shopping: "Shopping",
  bills: "Factures",
  education: "Éducation",
  travel: "Voyage",
  subscription: "Abonnements",
  other_expense: "Autre dépense",
};

interface TransactionItemProps {
  transaction: BudgetTransactionWithCategory;
}

export function TransactionItem({ transaction }: TransactionItemProps) {
  const isIncome = transaction.type === "income";

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: 2, backgroundColor: "hsl(var(--muted) / 0.4)" }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="flex items-center justify-between rounded-lg border bg-card p-3 cursor-default"
    >
      <div className="flex items-center gap-3">
        <motion.div
          whileHover={{ scale: 1.1, rotate: isIncome ? -10 : 10 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
          className={`flex h-9 w-9 items-center justify-center rounded-full ${
            isIncome ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
          }`}
        >
          {isIncome ? (
            <ArrowDownLeft className="h-6 w-6" />
          ) : (
            <ArrowUpRight className="h-6 w-6" />
          )}
        </motion.div>
        <div className="space-y-0.5">
          <p className="text-sm font-medium">
            {transaction.description || SUBTYPE_LABELS[transaction.subType ?? ""] || (isIncome ? "Revenu" : "Dépense")}
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
            <span>
              {format(new Date(transaction.date), "dd MMM yyyy", { locale: fr })}
            </span>
            {transaction.subType && (
              <Badge variant="outline" className="text-sm px-1 py-0">
                {SUBTYPE_LABELS[transaction.subType] || transaction.subType}
              </Badge>
            )}
            {transaction.category && (
              <CategoryBadge
                name={transaction.category.name}
                color={transaction.category.color}
              />
            )}
            {transaction.tags && transaction.tags.length > 0 && (
              <div className="flex gap-1">
                {transaction.tags.map((tag) => (
                  <Badge key={tag.id} variant="secondary" className="text-xs px-1 py-0">
                    {tag.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <motion.span
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`text-sm font-semibold ${
          isIncome ? "text-emerald-600" : "text-red-600"
        }`}
      >
        {isIncome ? "+" : "-"}
        {transaction.amount.toLocaleString("fr-FR", {
          style: "currency",
          currency: "EUR",
        })}
      </motion.span>
    </motion.div>
  );
}
