/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Landmark, TrendingUp, TrendingDown, Target, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useFinanceStats, useFinanceAccounts, useFinanceGoals } from "@/hooks/use-finance";

interface FinanceWidgetProps {
  workspaceId?: string;
}

export function FinanceWidget({ workspaceId }: FinanceWidgetProps) {
  const { stats, isLoading: statsLoading } = useFinanceStats(workspaceId);
  const { accounts, isLoading: accountsLoading } = useFinanceAccounts(workspaceId);
  const { goals, isLoading: goalsLoading } = useFinanceGoals(workspaceId);

  const isLoading = statsLoading || accountsLoading || goalsLoading;

  if (isLoading) {
    return (
      <Card className="overflow-hidden border-border/50">
        <div className="p-5 space-y-4">
          <Skeleton className="h-5 w-32" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
        </div>
      </Card>
    );
  }

  const totalBalance = accounts.reduce((sum: number, a: any) => sum + (a.balance || 0), 0);
  const monthlyNet = (stats?.monthlyIncome || 0) - (stats?.monthlyExpense || 0);
  const goalsProgress = stats?.goalsProgress || 0;

  const cards = [
    {
      label: "Solde total",
      value: totalBalance.toLocaleString("fr-FR", { style: "currency", currency: "EUR" }),
      icon: Landmark,
      color: "from-violet-500/10 to-indigo-500/5",
      iconColor: "text-violet-500",
      bgIcon: "bg-violet-500/10",
    },
    {
      label: "Revenus ce mois",
      value: (stats?.monthlyIncome || 0).toLocaleString("fr-FR", { style: "currency", currency: "EUR" }),
      icon: TrendingUp,
      color: "from-emerald-500/10 to-teal-500/5",
      iconColor: "text-emerald-500",
      bgIcon: "bg-emerald-500/10",
    },
    {
      label: "Dépenses ce mois",
      value: (stats?.monthlyExpense || 0).toLocaleString("fr-FR", { style: "currency", currency: "EUR" }),
      icon: TrendingDown,
      color: "from-rose-500/10 to-pink-500/5",
      iconColor: "text-rose-500",
      bgIcon: "bg-rose-500/10",
    },
    {
      label: "Objectifs",
      value: `${goalsProgress}%`,
      sub: `${goals.length} objectif${goals.length > 1 ? "s" : ""}`,
      icon: Target,
      color: "from-amber-500/10 to-orange-500/5",
      iconColor: "text-amber-500",
      bgIcon: "bg-amber-500/10",
    },
  ];

  return (
    <Card className="overflow-hidden border-border/50 bg-gradient-to-br from-background via-background to-muted/20">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Landmark className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-semibold text-sm">Finance</h3>
          </div>
          <Link
            href="/finance"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors group"
          >
            Voir tout
            <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {cards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className={`relative rounded-xl bg-gradient-to-br ${card.color} border border-border/40 p-3 hover:shadow-md transition-shadow`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  {card.label}
                </span>
                <div className={`h-6 w-6 rounded-md ${card.bgIcon} flex items-center justify-center`}>
                  <card.icon className={`h-4 w-4 ${card.iconColor}`} />
                </div>
              </div>
              <p className="text-lg font-bold tracking-tight">{card.value}</p>
              {card.sub && (
                <p className="text-xs text-muted-foreground mt-0.5">{card.sub}</p>
              )}
              {card.label === "Objectifs" && (
                <div className="mt-2 h-1 w-full rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${goalsProgress}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                  />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Mini net indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-3 flex items-center gap-2 text-sm"
        >
          <div
            className={`h-3 w-3 rounded-full ${monthlyNet >= 0 ? "bg-emerald-500" : "bg-rose-500"}`}
          />
          <span className="text-muted-foreground">
            Ce mois :{" "}
            <span className={monthlyNet >= 0 ? "text-emerald-600 font-medium" : "text-rose-600 font-medium"}>
              {monthlyNet >= 0 ? "+" : ""}
              {monthlyNet.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
            </span>
          </span>
        </motion.div>
      </div>
    </Card>
  );
}
