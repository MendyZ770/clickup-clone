"use client";

import { useState } from "react";
import { useWorkspace } from "@/hooks/use-workspace";
import {
  useFinanceAccounts,
  useFinanceTransactions,
  useFinanceGoals,
  useFinanceStats,
} from "@/hooks/use-finance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FinanceAccountList } from "@/components/finance/account-list";
import { FinanceTransactionList } from "@/components/finance/transaction-list";
import { FinanceGoalList } from "@/components/finance/goal-list";
import { AddTransactionDialog } from "@/components/finance/add-transaction-dialog";
import { AddAccountDialog } from "@/components/finance/add-account-dialog";
import { AddGoalDialog } from "@/components/finance/add-goal-dialog";
import { CategoryManager } from "@/components/finance/category-manager";
import {
  TrendingUp,
  CreditCard,
  Target,
  Settings,
  ArrowLeftRight,
} from "lucide-react";

export default function FinancePage() {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id;

  const { accounts } = useFinanceAccounts(workspaceId);
  const { transactions } = useFinanceTransactions(workspaceId);
  const { goals } = useFinanceGoals(workspaceId);
  const { stats } = useFinanceStats(workspaceId);

  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalBalance = accounts.reduce((sum: number, a: any) => sum + a.balance, 0);

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ma Finance</h1>
          <p className="text-sm text-muted-foreground">
            Gérez vos comptes, transactions et objectifs d&apos;épargne
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAddTransaction(true)}>
            <TrendingUp className="h-4 w-4 mr-2" />
            Nouvelle transaction
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Solde total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalBalance.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
            </div>
            <p className="text-xs text-muted-foreground">
              {accounts.length} compte{accounts.length > 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revenus ce mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {(stats?.monthlyIncome || 0).toLocaleString("fr-FR", {
                style: "currency",
                currency: "EUR",
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Dépenses ce mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">
              {(stats?.monthlyExpense || 0).toLocaleString("fr-FR", {
                style: "currency",
                currency: "EUR",
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Objectifs d&apos;épargne
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {goals.length} objectif{goals.length > 1 ? "s" : ""}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.totalSaved?.toLocaleString("fr-FR", {
                style: "currency",
                currency: "EUR",
              })}{" "}
              épargnés
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="accounts" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 md:w-auto md:inline-flex">
          <TabsTrigger value="accounts">
            <CreditCard className="h-4 w-4 mr-2" />
            Comptes
          </TabsTrigger>
          <TabsTrigger value="transactions">
            <ArrowLeftRight className="h-4 w-4 mr-2" />
            Transactions
          </TabsTrigger>
          <TabsTrigger value="goals">
            <Target className="h-4 w-4 mr-2" />
            Objectifs
          </TabsTrigger>
          <TabsTrigger value="categories">
            <Settings className="h-4 w-4 mr-2" />
            Catégories
          </TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setShowAddAccount(true)}>
              + Ajouter un compte
            </Button>
          </div>
          <FinanceAccountList accounts={accounts} />
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <FinanceTransactionList transactions={transactions} accounts={accounts} />
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setShowAddGoal(true)}>
              + Nouvel objectif
            </Button>
          </div>
          <FinanceGoalList goals={goals} />
        </TabsContent>

        <TabsContent value="categories">
          <CategoryManager workspaceId={workspaceId} />
        </TabsContent>
      </Tabs>

      <AddTransactionDialog
        open={showAddTransaction}
        onOpenChange={setShowAddTransaction}
        workspaceId={workspaceId}
      />
      <AddAccountDialog
        open={showAddAccount}
        onOpenChange={setShowAddAccount}
        workspaceId={workspaceId}
      />
      <AddGoalDialog
        open={showAddGoal}
        onOpenChange={setShowAddGoal}
        workspaceId={workspaceId}
      />
    </div>
  );
}
