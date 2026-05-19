"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, Wallet, TrendingUp, TrendingDown, PiggyBank } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { useWorkspace } from "@/hooks/use-workspace";
import { useBudget } from "@/hooks/use-budgets";
import { useBudgetStats } from "@/hooks/use-budget-stats";
import { useSWRConfig } from "swr";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BudgetAlert } from "@/components/budget/budget-alert";
import { BudgetLineChart } from "@/components/budget/budget-line-chart";
import { BudgetPieChart } from "@/components/budget/budget-pie-chart";
import { TransactionItem } from "@/components/budget/transaction-item";
import { AddTransactionDialog } from "@/components/budget/add-transaction-dialog";
import { BudgetDetailSkeleton } from "@/components/budget/budget-skeleton";
import { motion } from "framer-motion";

export default function BudgetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const budgetId = params.budgetId as string;
  const { currentWorkspace } = useWorkspace();
  const { budget, isLoading: budgetLoading } = useBudget(budgetId);
  const { stats, isLoading: statsLoading } = useBudgetStats(budgetId);
  const { mutate } = useSWRConfig();

  const [txDialogOpen, setTxDialogOpen] = useState(false);

  const handleAddTransaction = async (data: {
    amount: number;
    type: "income" | "expense";
    description?: string;
    date: string;
    categoryId?: string;
  }) => {
    await fetch(`/api/budget/${budgetId}/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    mutate(`/api/budget/${budgetId}`);
    mutate(`/api/budget/stats?budgetId=${budgetId}`);
  };

  const isLoading = budgetLoading || statsLoading;

  if (isLoading) return <BudgetDetailSkeleton />;

  if (!budget) {
    return (
      <div className="mx-auto max-w-6xl p-3 md:p-6">
        <p className="text-muted-foreground">Budget introuvable.</p>
      </div>
    );
  }

  const spentPercent = stats?.spentPercent ?? 0;

  return (
    <div className="mx-auto max-w-6xl p-3 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.push("/budget")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          icon={Wallet}
          title={budget.name}
          description={budget.description || undefined}
          actions={
            <Button onClick={() => setTxDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Transaction
            </Button>
          }
        />
      </div>

      {/* Alertes */}
      {spentPercent >= 80 && <BudgetAlert spentPercent={spentPercent} />}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <PiggyBank className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Budget alloué</p>
              <p className="text-lg font-semibold">
                {budget.amount.toLocaleString("fr-FR", { style: "currency", currency: budget.currency })}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Revenus</p>
              <p className="text-lg font-semibold text-emerald-600">
                {stats?.totalIncome.toLocaleString("fr-FR", { style: "currency", currency: budget.currency })}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Dépenses</p>
              <p className="text-lg font-semibold text-red-600">
                {stats?.totalExpense.toLocaleString("fr-FR", { style: "currency", currency: budget.currency })}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Solde restant</p>
              <p className={`text-lg font-semibold ${(stats?.remaining ?? 0) < 0 ? "text-red-600" : "text-purple-600"}`}>
                {stats?.remaining.toLocaleString("fr-FR", { style: "currency", currency: budget.currency })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Évolution mensuelle</CardTitle>
          </CardHeader>
          <CardContent>
            <BudgetLineChart data={stats?.monthlyEvolution ?? []} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Répartition par catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            <BudgetPieChart data={stats?.categoryBreakdown ?? []} />
          </CardContent>
        </Card>
      </div>

      {/* Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">Transactions</CardTitle>
          <Badge variant="secondary">{budget.transactions.length}</Badge>
        </CardHeader>
        <CardContent className="space-y-2">
          {budget.transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Aucune transaction. Ajoutez-en une pour commencer.
            </p>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ staggerChildren: 0.03 }}
              className="space-y-2"
            >
              {budget.transactions.map((tx) => (
                <motion.div key={tx.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
                  <TransactionItem transaction={tx} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </CardContent>
      </Card>

      <AddTransactionDialog
        open={txDialogOpen}
        onOpenChange={setTxDialogOpen}
        budgetId={budgetId}
        workspaceId={currentWorkspace?.id ?? ""}
        onSubmit={handleAddTransaction}
      />
    </div>
  );
}
