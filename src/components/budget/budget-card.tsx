"use client";

import Link from "next/link";
import { Pencil, Trash2, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import type { BudgetWithTransactions } from "@/types";

interface BudgetCardProps {
  budget: BudgetWithTransactions;
  onEdit: (budget: BudgetWithTransactions) => void;
  onDelete: (budgetId: string) => void;
}

export function BudgetCard({ budget, onEdit, onDelete }: BudgetCardProps) {
  const totalExpense = budget.transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = budget.transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const netSpent = totalExpense - totalIncome;
  const percentUsed = budget.amount > 0 ? Math.min((netSpent / budget.amount) * 100, 100) : 0;
  const remaining = budget.amount - netSpent;

  return (
    <Card className="group relative overflow-hidden hover:shadow-md transition-shadow">
      <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: budget.color }} />
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <Link href={`/budget/${budget.id}`} className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 shrink-0" style={{ color: budget.color }} />
              <h3 className="font-semibold truncate">{budget.name}</h3>
            </div>
            {budget.description && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{budget.description}</p>
            )}
          </Link>
          <div className="flex items-center gap-1 ml-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onEdit(budget)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer le budget ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est irréversible. Toutes les transactions associées seront supprimées.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-600 hover:bg-red-700"
                    onClick={() => onDelete(budget.id)}
                  >
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {netSpent.toLocaleString("fr-FR", { style: "currency", currency: budget.currency })} utilisé
            </span>
            <Badge variant="outline" className="text-xs">
              {percentUsed.toFixed(0)}%
            </Badge>
          </div>
          <Progress value={percentUsed} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Reste :{" "}
              <span className={cn("font-medium", remaining < 0 ? "text-red-500" : "text-emerald-600")}>
                {remaining.toLocaleString("fr-FR", { style: "currency", currency: budget.currency })}
              </span>
            </span>
            <span>
              {budget.amount.toLocaleString("fr-FR", { style: "currency", currency: budget.currency })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
