/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Banknote, Bitcoin, PiggyBank, Landmark, CreditCard } from "lucide-react";

const TYPE_ICONS: Record<string, any> = {
  bank: Landmark,
  cash: Banknote,
  crypto: Bitcoin,
  savings: PiggyBank,
  investment: TrendingUpIcon,
  other: CreditCard,
};

function TrendingUpIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
  );
}

export function FinanceAccountList({ accounts }: { accounts: any[] }) {
  if (accounts.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Aucun compte. Créez votre premier compte pour commencer.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {accounts.map((account: any) => {
        const Icon = TYPE_ICONS[account.type] || CreditCard;
        return (
          <Card key={account.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full"
                    style={{ backgroundColor: account.color + "20" }}
                  >
                    <Icon className="h-5 w-5" style={{ color: account.color }} />
                  </div>
                  <div>
                    <p className="font-medium">{account.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {account.type === "bank" && account.bankName
                        ? `${account.bankName} • `
                        : ""}
                      {account.type}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold">
                  {account.balance.toLocaleString("fr-FR", {
                    style: "currency",
                    currency: account.currency,
                  })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {account._count?.transactions || 0} transaction
                  {(account._count?.transactions || 0) > 1 ? "s" : ""}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
