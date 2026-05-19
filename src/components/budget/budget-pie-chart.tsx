"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface CategoryData {
  name: string;
  color: string;
  amount: number;
}

interface BudgetPieChartProps {
  data: CategoryData[];
}

export function BudgetPieChart({ data }: BudgetPieChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
        Aucune dépense par catégorie
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={data}
          dataKey="amount"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={80}
          innerRadius={50}
          paddingAngle={3}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) =>
            value.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })
          }
          contentStyle={{ borderRadius: 8, border: "1px solid #E5E7EB" }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
