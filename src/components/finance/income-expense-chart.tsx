"use client";

import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartDataTable } from "@/components/shared/chart-data-table";
import { formatCurrency } from "@/lib/utils";
import type { FinanceTransactionWithCategory } from "@/hooks/use-finance";

export function IncomeExpenseChart({
  transactions,
  currency = "EUR",
}: {
  transactions: FinanceTransactionWithCategory[];
  currency?: string;
}) {
  // On n'affiche que les transactions dans la devise principale du workspace
  const scopedTransactions = transactions.filter(
    (t) => (t.account?.currency || currency) === currency
  );

  const now = new Date();
  const data = Array.from({ length: 12 }, (_, index) => {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - (11 - index), 1);
    const nextMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);
    const monthTransactions = scopedTransactions.filter((t) => {
      const d = new Date(t.date);
      return d >= monthDate && d < nextMonth;
    });
    const income = monthTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = monthTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      month: monthDate.toLocaleDateString("fr-FR", { month: "short" }),
      income,
      expense,
    };
  });

  const hasData = data.some((d) => d.income > 0 || d.expense > 0);

  if (!hasData) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Revenus vs Dépenses</CardTitle>
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
          Aucune donnée
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <Card className="border-border/50 bg-gradient-to-br from-background to-muted/10 overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-violet-400" />
            Revenus vs Dépenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartDataTable
            caption="Revenus et dépenses par mois"
            columns={["Mois", "Revenus", "Dépenses"]}
            rows={data.map((entry) => [
              entry.month,
              formatCurrency(entry.income, currency),
              formatCurrency(entry.expense, currency),
            ])}
          />
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} barGap={2} barCategoryGap="20%" accessibilityLayer>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value), currency)}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--card))",
                    fontSize: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  }}
                />
                <Bar dataKey="income" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={24} />
                <Bar dataKey="expense" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
