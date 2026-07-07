"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useWorkspace } from "@/hooks/use-workspace";
import { revalidateFinance } from "@/lib/swr-config";
import {
  useFinanceAccounts,
  useFinanceTransactions,
  useFinanceGoals,
  useFinanceStats,
  useFinanceCategories,
} from "@/hooks/use-finance";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { FinanceAccountList } from "@/components/finance/account-list";
import { FinanceTransactionList } from "@/components/finance/transaction-list";
import { FinanceGoalList } from "@/components/finance/goal-list";
import { AddTransactionDialog } from "@/components/finance/add-transaction-dialog";
import { AddAccountDialog } from "@/components/finance/add-account-dialog";
import { AddGoalDialog } from "@/components/finance/add-goal-dialog";
import { CategoryManager } from "@/components/finance/category-manager";
import { ExpenseChart } from "@/components/finance/expense-chart";
import { IncomeExpenseChart } from "@/components/finance/income-expense-chart";
import { PeriodFilter, type PeriodFilter as PeriodFilterType } from "@/components/finance/period-filter";
import { EnableBankingLinkButton } from "@/components/finance/enablebanking-link-button";
import { EnableBankingCallback } from "@/components/finance/enablebanking-callback";
import { SyncAccountsButton } from "@/components/finance/sync-accounts-button";
import { Suspense } from "react";
import {
  TrendingUp,
  CreditCard,
  Target,
  Settings,
  ArrowLeftRight,
  Landmark,
  Sparkles,
  Loader2,
} from "lucide-react";

function getPeriodDates(period: PeriodFilterType) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  switch (period) {
    case "this-month":
      return { start: new Date(year, month, 1), end: new Date(year, month + 1, 0) };
    case "last-month":
      return { start: new Date(year, month - 1, 1), end: new Date(year, month, 0) };
    case "this-year":
      return { start: new Date(year, 0, 1), end: new Date(year, 11, 31) };
    default:
      return { start: null, end: null };
  }
}

function filterByPeriod<T extends { date: Date | string }>(data: T[], period: PeriodFilterType): T[] {
  if (period === "all") return data;
  const { start, end } = getPeriodDates(period);
  if (!start || !end) return data;
  return data.filter((item) => {
    const d = new Date(item.date);
    return d >= start && d <= end;
  });
}

export default function FinancePage() {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id;
  const { toast } = useToast();
  const hasAutoSynced = useRef(false);

  const { accounts } = useFinanceAccounts(workspaceId);
  const { transactions } = useFinanceTransactions(workspaceId);
  const { goals } = useFinanceGoals(workspaceId);
  const { stats } = useFinanceStats(workspaceId);
  useFinanceCategories(workspaceId);

  const [period, setPeriod] = useState<PeriodFilterType>("this-month");
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);

  // Auto-sync on page load
  useEffect(() => {
    const autoSync = async () => {
      if (hasAutoSynced.current || !accounts || accounts.length === 0) return;
      
      const linkedAccounts = accounts.filter((a: any) => a.ebAccountId);
      if (linkedAccounts.length === 0) return;

      // Only auto-sync once per session to avoid spamming the bank API
      const sessionKey = `finance_synced_${workspaceId}`;
      if (sessionStorage.getItem(sessionKey)) return;

      hasAutoSynced.current = true;
      sessionStorage.setItem(sessionKey, "true");

      let totalImported = 0;
      
      try {
        for (const acc of linkedAccounts) {
          const res = await fetch("/api/finance/enablebanking/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ accountId: acc.id })
          });
          
          if (res.ok) {
            const data = await res.json();
            if (data.importedCount) {
              totalImported += data.importedCount;
            }
          }
        }

        if (totalImported > 0) {
          toast({
            title: "Synchronisation auto réussie",
            description: `${totalImported} nouvelle(s) transaction(s) importée(s).`,
          });
          await revalidateFinance(workspaceId);
        }
      } catch (e) {
        console.error("Auto-sync failed", e);
      }
    };

    autoSync();
  }, [accounts, workspaceId, toast]);

  const totalBalance = accounts?.reduce((sum, a) => sum + a.balance, 0) || 0;

  const filteredTransactions = useMemo(() => filterByPeriod(transactions || [], period), [transactions, period]);

  const expenseByCategory = useMemo(() => {
    const map = new Map();
    filteredTransactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        const catId = t.categoryId || "none";
        const existing = map.get(catId) || { amount: 0, category: t.category };
        existing.amount += t.amount;
        map.set(catId, existing);
      });
    return Array.from(map.values());
  }, [filteredTransactions]);

  const handleMutate = async () => {
    await revalidateFinance(workspaceId);
  };

  if (!accounts || !transactions) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const statCards = [
    {
      label: "Solde total",
      value: totalBalance.toLocaleString("fr-FR", { style: "currency", currency: "EUR" }),
      sub: `${accounts.length} compte${accounts.length > 1 ? "s" : ""}`,
      color: "from-violet-500/10 to-indigo-500/5",
      iconColor: "text-violet-500",
      bgIcon: "bg-violet-500/10",
      icon: Landmark,
    },
    {
      label: "Revenus",
      value: (stats?.monthlyIncome || 0).toLocaleString("fr-FR", { style: "currency", currency: "EUR" }),
      sub: "Ce mois",
      color: "from-emerald-500/10 to-teal-500/5",
      iconColor: "text-emerald-500",
      bgIcon: "bg-emerald-500/10",
      icon: TrendingUp,
    },
    {
      label: "Dépenses",
      value: (stats?.monthlyExpense || 0).toLocaleString("fr-FR", { style: "currency", currency: "EUR" }),
      sub: "Ce mois",
      color: "from-rose-500/10 to-pink-500/5",
      iconColor: "text-rose-500",
      bgIcon: "bg-rose-500/10",
      icon: ArrowLeftRight,
    },
    {
      label: "Objectifs",
      value: `${goals.length}`,
      sub: `${stats?.totalSaved?.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })} épargnés`,
      color: "from-amber-500/10 to-orange-500/5",
      iconColor: "text-amber-500",
      bgIcon: "bg-amber-500/10",
      icon: Target,
    },
  ];

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Ma Finance</h1>
            <p className="text-sm text-muted-foreground">
              Visuel en temps réel de vos comptes et objectifs
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <PeriodFilter value={period} onChange={setPeriod} />
          <Button onClick={() => setShowAddTransaction(true)} className="shadow-md shadow-violet-500/10">
            <TrendingUp className="h-4 w-4 mr-2" />
            Transaction
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
          >
            <Card className={`border-border/30 bg-gradient-to-br ${card.color} backdrop-blur-xl overflow-hidden hover:shadow-xl hover:-translate-y-1 hover:shadow-black/10 transition-all duration-300 rounded-[2rem]`}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                    {card.label}
                  </span>
                  <div className={`h-7 w-7 rounded-md ${card.bgIcon} flex items-center justify-center`}>
                    <card.icon className={`h-3.5 w-3.5 ${card.iconColor}`} />
                  </div>
                </div>
                <p className="text-xl font-bold tracking-tight">{card.value}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{card.sub}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ExpenseChart data={expenseByCategory} />
        <IncomeExpenseChart transactions={filteredTransactions} />
      </div>

      <Suspense fallback={null}>
        <EnableBankingCallback handleMutate={handleMutate} />
      </Suspense>

      <Tabs defaultValue="accounts" className="space-y-4">
        <TabsList className="flex w-full overflow-x-auto md:w-auto md:inline-flex bg-muted/40 border border-border/30 p-1 rounded-lg">
          <TabsTrigger value="accounts" className="flex-shrink-0 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Comptes</span>
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex-shrink-0 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2">
            <ArrowLeftRight className="h-4 w-4" />
            <span className="hidden sm:inline">Transactions</span>
          </TabsTrigger>
          <TabsTrigger value="goals" className="flex-shrink-0 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Objectifs</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex-shrink-0 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Catégories</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-4">
          <div className="flex justify-end gap-2">
            <SyncAccountsButton accounts={accounts} onSync={handleMutate} />
            <EnableBankingLinkButton workspaceId={workspaceId!} onSuccess={handleMutate} variant="outline" />
            <Button variant="default" onClick={() => setShowAddAccount(true)}>
              + Ajouter manuel
            </Button>
          </div>
          <FinanceAccountList accounts={accounts} onMutate={handleMutate} />
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <FinanceTransactionList transactions={filteredTransactions} accounts={accounts} onMutate={handleMutate} onAddTransaction={() => setShowAddTransaction(true)} />
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setShowAddGoal(true)}>
              + Nouvel objectif
            </Button>
          </div>
          <FinanceGoalList goals={goals} onMutate={handleMutate} />
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
