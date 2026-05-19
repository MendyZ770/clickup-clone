"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

interface MonthlyData {
  month: string;
  income: number;
  expense: number;
}

interface BudgetLineChartProps {
  data: MonthlyData[];
}

export function BudgetLineChart({ data }: BudgetLineChartProps) {
  const formatted = data.map((d) => ({
    ...d,
    label: format(parseISO(`${d.month}-01`), "MMM yyyy", { locale: fr }),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={formatted} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          formatter={(value: number) =>
            value.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })
          }
          contentStyle={{ borderRadius: 8, border: "1px solid #E5E7EB" }}
        />
        <Legend />
        <Area
          type="monotone"
          dataKey="income"
          name="Revenus"
          stroke="#10B981"
          fillOpacity={1}
          fill="url(#colorIncome)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="expense"
          name="Dépenses"
          stroke="#EF4444"
          fillOpacity={1}
          fill="url(#colorExpense)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
