"use client";

import { motion } from "framer-motion";
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
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, transition: { type: "spring", stiffness: 400, damping: 17 } }}
      whileTap={{ scale: 0.98 }}
    >
    <Card className="group relative overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <motion.div
        className="absolute top-0 left-0 w-full h-1"
        style={{ backgroundColor: budget.color }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <Link href={`/budget/${budget.id}`} className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <motion.div whileHover={{ rotate: 10, scale: 1.1 }} transition={{ type: "spring", stiffness: 300, damping: 15 }}>
                <Wallet className="h-6 w-6 shrink-0" style={{ color: budget.color }} />
              </motion.div>
              <h3 className="font-semibold truncate">{budget.name}</h3>
            </div>
            {budget.description && (
              <p className="text-sm text-muted-foreground mt-0.5 truncate">{budget.description}</p>
            )}
          </Link>
          <div className="flex items-center gap-1 ml-2">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onEdit(budget)}
              >
                <Pencil className="h-6 w-6" />
              </Button>
            </motion.div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-6 w-6" />
                  </Button>
                </motion.div>
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
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Badge variant="outline" className="text-sm">
                {percentUsed.toFixed(0)}%
              </Badge>
            </motion.div>
          </div>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{ originX: 0 }}
          >
            <Progress value={percentUsed} className="h-2.5" />
          </motion.div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
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
    </motion.div>
  );
}
