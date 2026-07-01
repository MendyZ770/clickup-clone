"use client";

import { useState, useEffect } from "react";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";
import { CheckCircle2, Clock, ListTodo, Activity } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const COLORS = ["#10b981", "#3b82f6", "#f43f5e", "#f59e0b"];

// 1. Tasks Overview (Pie Chart)
export function TasksOverviewWidget() {
  const data = [
    { name: "Terminées", value: 45 },
    { name: "En cours", value: 25 },
    { name: "À faire", value: 30 },
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={5}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [`${value}%`, "Proportion"]} />
        <Legend verticalAlign="bottom" height={36} />
      </PieChart>
    </ResponsiveContainer>
  );
}

// 2. Stat Cards (Counters)
export function StatCardsWidget() {
  return (
    <div className="grid grid-cols-3 gap-4 h-full items-center">
      <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="h-6 w-6 mb-1" />
        <span className="text-2xl font-bold">45</span>
        <span className="text-xs font-medium text-center">Tâches terminées</span>
      </div>
      <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
        <Clock className="h-6 w-6 mb-1" />
        <span className="text-2xl font-bold">12h</span>
        <span className="text-xs font-medium text-center">Temps pointé</span>
      </div>
      <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
        <ListTodo className="h-6 w-6 mb-1" />
        <span className="text-2xl font-bold">5</span>
        <span className="text-xs font-medium text-center">En retard</span>
      </div>
    </div>
  );
}

// 3. Activity Feed
export function ActivityFeedWidget() {
  const activities = [
    { id: 1, user: "Mendy Z.", action: "a terminé la tâche", task: "Intégration API", time: new Date(Date.now() - 1000 * 60 * 30) },
    { id: 2, user: "Sarah L.", action: "a commenté sur", task: "Design System", time: new Date(Date.now() - 1000 * 60 * 60 * 2) },
    { id: 3, user: "Mendy Z.", action: "a créé la tâche", task: "Correction Bug #42", time: new Date(Date.now() - 1000 * 60 * 60 * 5) },
  ];

  return (
    <div className="space-y-4 h-full overflow-y-auto pr-2">
      {activities.map((act) => (
        <div key={act.id} className="flex gap-3 text-sm">
          <div className="mt-0.5 bg-primary/10 p-1.5 rounded-full text-primary shrink-0">
            <Activity className="h-3 w-3" />
          </div>
          <div>
            <p className="text-foreground">
              <span className="font-medium">{act.user}</span> {act.action} <span className="font-medium text-primary">{act.task}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Il y a {format(act.time, "H'h' m'm'", { locale: fr })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// 4. Workload Chart (Bar Chart)
export function WorkloadChartWidget() {
  const data = [
    { name: "Lun", hours: 6 },
    { name: "Mar", hours: 8 },
    { name: "Mer", hours: 5 },
    { name: "Jeu", hours: 9 },
    { name: "Ven", hours: 4 },
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
        <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
        <YAxis axisLine={false} tickLine={false} fontSize={12} />
        <Tooltip 
          cursor={{ fill: 'hsl(var(--muted))' }}
          contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}
        />
        <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
