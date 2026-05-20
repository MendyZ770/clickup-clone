/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, ArrowRightLeft } from "lucide-react";

export function FinanceTransactionList({ transactions, accounts }: { transactions: any[]; accounts: any[] }) {
  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Aucune transaction. Ajoutez votre première transaction.
        </CardContent>
      </Card>
    );
  }

  const getAccountName = (id: string) => accounts.find((a: any) => a.id === id)?.name || id;

  return (
    <Card>
      <CardContent className="p-0">
        <div className="divide-y">
          {transactions.map((t: any) => (
            <div key={t.id} className="flex items-center justify-between p-4 hover:bg-accent/50">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full ${
                    t.type === "income"
                      ? "bg-emerald-500/10 text-emerald-500"
                      : t.type === "expense"
                      ? "bg-rose-500/10 text-rose-500"
                      : "bg-blue-500/10 text-blue-500"
                  }`}
                >
                  {t.type === "income" ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : t.type === "expense" ? (
                    <TrendingDown className="h-4 w-4" />
                  ) : (
                    <ArrowRightLeft className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm">{t.description || "Sans description"}</p>
                  <p className="text-xs text-muted-foreground">
                    {getAccountName(t.accountId)}
                    {t.category && ` • ${t.category.name}`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={`font-semibold ${
                    t.type === "income"
                      ? "text-emerald-600"
                      : t.type === "expense"
                      ? "text-rose-600"
                      : "text-blue-600"
                  }`}
                >
                  {t.type === "income" ? "+" : t.type === "expense" ? "-" : ""}
                  {t.amount.toLocaleString("fr-FR", {
                    style: "currency",
                    currency: t.account?.currency || "EUR",
                  })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(t.date).toLocaleDateString("fr-FR")}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
