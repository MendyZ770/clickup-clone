"use client";

import { useState, useEffect } from "react";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";
import { CheckCircle2, Clock, ListTodo, Activity, TrendingUp, TrendingDown, ArrowUpRight } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const PIE_COLORS = ["#10b981", "#3b82f6", "#f43f5e", "#f59e0b"];

// 1. Tasks Overview (Donut Chart)
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
          innerRadius={70}
          outerRadius={90}
          paddingAngle={8}
          dataKey="value"
          cornerRadius={6}
          stroke="none"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value: number) => [`${value}%`, "Proportion"]}
          contentStyle={{ 
            borderRadius: '12px', 
            border: '1px solid hsl(var(--border))',
            boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)'
          }}
        />
        <Legend 
          verticalAlign="bottom" 
          height={36}
          iconType="circle"
          wrapperStyle={{ fontSize: '13px', color: 'hsl(var(--muted-foreground))' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// 2. Stat Cards (Premium Cards)
export function StatCardsWidget() {
  return (
    <div className="grid grid-cols-3 gap-6 h-full items-center px-2">
      <div className="flex flex-col justify-center p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <CheckCircle2 className="w-24 h-24 text-emerald-500 -mt-8 -mr-8" />
        </div>
        <div className="flex items-center gap-2 mb-3">
          <div className="bg-emerald-500/20 p-2 rounded-lg">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Tâches terminées</span>
        </div>
        <div className="flex items-end gap-3 z-10">
          <span className="text-5xl font-light tracking-tight text-foreground">45</span>
          <div className="flex items-center text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full text-xs font-medium mb-1">
            <TrendingUp className="w-3 h-3 mr-1" />
            +12%
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-center p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Clock className="w-24 h-24 text-blue-500 -mt-8 -mr-8" />
        </div>
        <div className="flex items-center gap-2 mb-3">
          <div className="bg-blue-500/20 p-2 rounded-lg">
            <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">Temps pointé</span>
        </div>
        <div className="flex items-end gap-3 z-10">
          <span className="text-5xl font-light tracking-tight text-foreground">12h</span>
          <div className="flex items-center text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full text-xs font-medium mb-1">
            <TrendingUp className="w-3 h-3 mr-1" />
            +4h
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-center p-5 rounded-2xl bg-gradient-to-br from-rose-500/10 to-transparent border border-rose-500/20 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <ListTodo className="w-24 h-24 text-rose-500 -mt-8 -mr-8" />
        </div>
        <div className="flex items-center gap-2 mb-3">
          <div className="bg-rose-500/20 p-2 rounded-lg">
            <ListTodo className="h-5 w-5 text-rose-600 dark:text-rose-400" />
          </div>
          <span className="text-sm font-semibold text-rose-700 dark:text-rose-400">En retard</span>
        </div>
        <div className="flex items-end gap-3 z-10">
          <span className="text-5xl font-light tracking-tight text-foreground">5</span>
          <div className="flex items-center text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full text-xs font-medium mb-1">
            <TrendingDown className="w-3 h-3 mr-1" />
            -2
          </div>
        </div>
      </div>
    </div>
  );
}

// 3. Activity Feed (Timeline)
export function ActivityFeedWidget() {
  const activities = [
    { id: 1, user: "Mendy Z.", initials: "MZ", color: "bg-blue-500", action: "a terminé la tâche", task: "Intégration de l'API de Paiement", time: new Date(Date.now() - 1000 * 60 * 30) },
    { id: 2, user: "Sarah L.", initials: "SL", color: "bg-emerald-500", action: "a commenté sur", task: "Mise à jour du Design System", time: new Date(Date.now() - 1000 * 60 * 60 * 2) },
    { id: 3, user: "Mendy Z.", initials: "MZ", color: "bg-blue-500", action: "a créé la tâche", task: "Correction du Bug #420 (Urgent)", time: new Date(Date.now() - 1000 * 60 * 60 * 5) },
    { id: 4, user: "Alex B.", initials: "AB", color: "bg-rose-500", action: "a modifié le statut de", task: "Campagne Marketing Q3", time: new Date(Date.now() - 1000 * 60 * 60 * 24) },
  ];

  return (
    <div className="h-full overflow-y-auto pr-4 relative">
      <div className="absolute left-4 top-2 bottom-2 w-px bg-border/50" />
      <div className="space-y-6">
        {activities.map((act) => (
          <div key={act.id} className="flex gap-4 relative">
            <div className={`h-8 w-8 rounded-full ${act.color} text-white flex items-center justify-center text-xs font-bold shadow-md shrink-0 z-10 ring-4 ring-card`}>
              {act.initials}
            </div>
            <div className="pt-1">
              <p className="text-[13px] text-foreground leading-relaxed">
                <span className="font-semibold">{act.user}</span> <span className="text-muted-foreground">{act.action}</span>{" "}
                <span className="font-medium text-primary hover:underline cursor-pointer">{act.task}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {format(act.time, "d MMM à H'h'mm", { locale: fr })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 4. Workload Chart (Gradient Bar Chart)
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
      <BarChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
        <XAxis 
          dataKey="name" 
          axisLine={false} 
          tickLine={false} 
          fontSize={12} 
          tick={{ fill: 'hsl(var(--muted-foreground))' }} 
          dy={10}
        />
        <YAxis 
          axisLine={false} 
          tickLine={false} 
          fontSize={12} 
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
        />
        <Tooltip 
          cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
          contentStyle={{ 
            backgroundColor: 'hsl(var(--background))', 
            borderColor: 'hsl(var(--border))',
            borderRadius: '8px',
            boxShadow: '0 4px 20px -5px rgba(0,0,0,0.1)'
          }}
        />
        <Bar 
          dataKey="hours" 
          fill="url(#colorHours)" 
          radius={[6, 6, 0, 0]} 
          maxBarSize={40}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
