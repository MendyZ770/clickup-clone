/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const COLORS = [
  "#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#3B82F6",
  "#EF4444", "#06B6D4", "#84CC16", "#F97316", "#6366F1",
];

export function ExpenseChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Dépenses par catégorie</CardTitle>
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
          Aucune donnée
        </CardContent>
      </Card>
    );
  }

  const chartData = data
    .filter((item: any) => item.amount > 0)
    .map((item: any) => ({
      name: item.category?.name || "Non catégorisé",
      value: item.amount,
      color: item.category?.color || COLORS[0],
    }));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-border/50 bg-gradient-to-br from-background to-muted/10 overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-rose-400" />
            Dépenses par catégorie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) =>
                    Number(value).toLocaleString("fr-FR", { style: "currency", currency: "EUR" })
                  }
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--card))",
                    fontSize: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {chartData.slice(0, 5).map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-1.5 text-xs">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: item.color || COLORS[i % COLORS.length] }}
                />
                <span className="text-muted-foreground truncate max-w-[80px]">{item.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
