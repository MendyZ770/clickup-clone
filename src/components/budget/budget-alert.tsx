"use client";

import { AlertTriangle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface BudgetAlertProps {
  spentPercent: number;
}

export function BudgetAlert({ spentPercent }: BudgetAlertProps) {
  if (spentPercent >= 100) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span className="font-medium">Dépassement de budget !</span>
        <span className="text-red-600/80 dark:text-red-400/80">
          Vous avez dépassé votre budget alloué ({spentPercent.toFixed(0)}% utilisé).
        </span>
      </div>
    );
  }

  if (spentPercent >= 80) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span className="font-medium">Attention</span>
        <span className="text-amber-600/80 dark:text-amber-400/80">
          Vous avez utilisé {spentPercent.toFixed(0)}% de votre budget.
        </span>
      </div>
    );
  }

  return null;
}
