/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target, CheckCircle2 } from "lucide-react";

export function FinanceGoalList({ goals }: { goals: any[] }) {
  if (goals.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Aucun objectif. Créez votre premier objectif d&apos;épargne.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {goals.map((goal: any) => {
        const progress = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;
        return (
          <Card key={goal.id}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full"
                    style={{ backgroundColor: goal.color + "20" }}
                  >
                    {goal.isCompleted ? (
                      <CheckCircle2 className="h-4 w-4" style={{ color: goal.color }} />
                    ) : (
                      <Target className="h-4 w-4" style={{ color: goal.color }} />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{goal.name}</p>
                    {goal.account && (
                      <p className="text-xs text-muted-foreground">{goal.account.name}</p>
                    )}
                  </div>
                </div>
                {goal.deadline && (
                  <p className="text-xs text-muted-foreground">
                    {new Date(goal.deadline).toLocaleDateString("fr-FR")}
                  </p>
                )}
              </div>

              <Progress value={progress} className="h-2" />

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {goal.currentAmount.toLocaleString("fr-FR", {
                    style: "currency",
                    currency: goal.currency,
                  })}
                </span>
                <span className="font-medium">
                  {goal.targetAmount.toLocaleString("fr-FR", {
                    style: "currency",
                    currency: goal.currency,
                  })}
                </span>
              </div>
              <p className="text-xs text-muted-foreground text-center">{Math.round(progress)}% atteint</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
