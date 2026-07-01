"use client";

import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area
} from "recharts";
import { CheckCircle2, Clock, ListTodo, Activity, TrendingUp, TrendingDown, Wallet, Target } from "lucide-react";
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
    <div className="flex flex-col @sm:flex-row h-full w-full items-center justify-center">
      <div className="w-full @sm:w-1/2 h-full min-h-[120px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="80%"
              paddingAngle={4}
              dataKey="value"
              cornerRadius={4}
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => [`${value}%`, "Proportion"]}
              contentStyle={{ 
                borderRadius: '8px', 
                border: '1px solid hsl(var(--border))',
                boxShadow: '0 4px 20px -5px rgba(0,0,0,0.1)'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      {/* Custom Legend to respond to container size */}
      <div className="w-full @sm:w-1/2 flex flex-row @sm:flex-col justify-center gap-3 @sm:gap-4 mt-2 @sm:mt-0 @sm:pl-4">
        {data.map((entry, index) => (
          <div key={entry.name} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
            <div className="flex flex-col @sm:flex-row @sm:items-center @sm:justify-between w-full">
              <span className="text-[11px] @sm:text-xs text-muted-foreground">{entry.name}</span>
              <span className="text-xs @sm:text-sm font-medium">{entry.value}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 2. Stat Cards (Minimalist Bento)
export function StatCardsWidget() {
  return (
    <div className="grid grid-cols-1 @sm:grid-cols-3 gap-3 @sm:gap-4 h-full">
      <div className="flex items-center @sm:flex-col @sm:items-start justify-between @sm:justify-center p-3 @sm:p-4 rounded-xl bg-muted/30 border border-border/50">
        <div className="flex items-center gap-2 mb-0 @sm:mb-2">
          <div className="bg-emerald-500/10 p-1.5 rounded-md shrink-0">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <span className="text-xs font-medium text-muted-foreground hidden @sm:inline">Terminées</span>
        </div>
        <div className="flex items-end gap-2">
          <span className="text-2xl @sm:text-3xl font-semibold text-foreground">45</span>
          <span className="text-xs text-emerald-600 font-medium mb-1 hidden @sm:inline">+12%</span>
        </div>
      </div>

      <div className="flex items-center @sm:flex-col @sm:items-start justify-between @sm:justify-center p-3 @sm:p-4 rounded-xl bg-muted/30 border border-border/50">
        <div className="flex items-center gap-2 mb-0 @sm:mb-2">
          <div className="bg-blue-500/10 p-1.5 rounded-md shrink-0">
            <Clock className="h-4 w-4 text-blue-600" />
          </div>
          <span className="text-xs font-medium text-muted-foreground hidden @sm:inline">Temps</span>
        </div>
        <div className="flex items-end gap-2">
          <span className="text-2xl @sm:text-3xl font-semibold text-foreground">12h</span>
          <span className="text-xs text-blue-600 font-medium mb-1 hidden @sm:inline">+4h</span>
        </div>
      </div>

      <div className="flex items-center @sm:flex-col @sm:items-start justify-between @sm:justify-center p-3 @sm:p-4 rounded-xl bg-muted/30 border border-border/50">
        <div className="flex items-center gap-2 mb-0 @sm:mb-2">
          <div className="bg-rose-500/10 p-1.5 rounded-md shrink-0">
            <ListTodo className="h-4 w-4 text-rose-600" />
          </div>
          <span className="text-xs font-medium text-muted-foreground hidden @sm:inline">En retard</span>
        </div>
        <div className="flex items-end gap-2">
          <span className="text-2xl @sm:text-3xl font-semibold text-foreground">5</span>
          <span className="text-xs text-rose-600 font-medium mb-1 hidden @sm:inline">-2</span>
        </div>
      </div>
    </div>
  );
}

// 3. Activity Feed (Responsive Timeline)
export function ActivityFeedWidget() {
  const activities = [
    { id: 1, user: "Mendy Z.", initials: "MZ", color: "bg-blue-500", action: "a terminé", task: "Intégration API", time: new Date(Date.now() - 1000 * 60 * 30) },
    { id: 2, user: "Sarah L.", initials: "SL", color: "bg-emerald-500", action: "a commenté", task: "Design System", time: new Date(Date.now() - 1000 * 60 * 60 * 2) },
    { id: 3, user: "Mendy Z.", initials: "MZ", color: "bg-blue-500", action: "a créé", task: "Correction Bug #420", time: new Date(Date.now() - 1000 * 60 * 60 * 5) },
    { id: 4, user: "Alex B.", initials: "AB", color: "bg-rose-500", action: "a modifié", task: "Campagne Q3", time: new Date(Date.now() - 1000 * 60 * 60 * 24) },
  ];

  return (
    <div className="h-full overflow-y-auto relative">
      <div className="absolute left-3.5 top-2 bottom-2 w-px bg-border/50" />
      <div className="space-y-4 @sm:space-y-5">
        {activities.map((act, idx) => (
          // Use container queries to hide elements if container is too short (e.g., cut in half)
          <div key={act.id} className={`flex gap-3 relative ${idx > 1 ? 'hidden @[150px]:flex' : 'flex'}`}>
            <div className={`h-7 w-7 rounded-full ${act.color} text-white flex items-center justify-center text-[10px] font-bold shadow-sm shrink-0 z-10 ring-4 ring-card`}>
              {act.initials}
            </div>
            <div className="pt-0.5">
              <p className="text-xs text-foreground leading-tight">
                <span className="font-semibold">{act.user}</span> <span className="text-muted-foreground">{act.action}</span>{" "}
                <span className="font-medium text-primary">{act.task}</span>
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {format(act.time, "d MMM à H'h'mm", { locale: fr })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 4. Workload Chart (Clearer Labels)
export function WorkloadChartWidget() {
  const data = [
    { name: "Lun", hours: 6 },
    { name: "Mar", hours: 8 },
    { name: "Mer", hours: 5 },
    { name: "Jeu", hours: 9 },
    { name: "Ven", hours: 4 },
  ];

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground">Heures de travail (estimées)</span>
      </div>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
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
              fontSize={11} 
              tick={{ fill: 'hsl(var(--muted-foreground))' }} 
              dy={5}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              fontSize={11} 
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value) => `${value}h`}
            />
            <Tooltip 
              cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
              formatter={(value: number) => [`${value} heures`, "Charge"]}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))', 
                borderColor: 'hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px'
              }}
            />
            <Bar 
              dataKey="hours" 
              fill="url(#colorHours)" 
              radius={[4, 4, 0, 0]} 
              maxBarSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// 5. Finance Overview (New)
export function FinanceOverviewWidget() {
  const data = [
    { name: "S1", revenu: 4000 },
    { name: "S2", revenu: 3000 },
    { name: "S3", revenu: 5000 },
    { name: "S4", revenu: 4500 },
    { name: "S5", revenu: 6000 },
  ];

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-muted-foreground font-medium">Revenu du mois</p>
          <p className="text-2xl font-bold">12 450 €</p>
        </div>
        <div className="bg-emerald-500/10 text-emerald-600 px-2 py-1 rounded-md text-xs font-semibold flex items-center">
          <TrendingUp className="w-3 h-3 mr-1" />
          +8.2%
        </div>
      </div>
      
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenu" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Tooltip 
              formatter={(value: number) => [`${value} €`, "Revenu"]}
              contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
            />
            <Area type="monotone" dataKey="revenu" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenu)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// 6. Goals Progress (New)
export function GoalsProgressWidget() {
  return (
    <div className="flex flex-col h-full w-full justify-center">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-primary/10 rounded-lg text-primary">
          <Target className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-semibold">Lancement V2</h4>
          <p className="text-xs text-muted-foreground">Échéance : 15 Août</p>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-medium">
          <span>Progression</span>
          <span className="text-primary">68%</span>
        </div>
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full" style={{ width: '68%' }} />
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-border/50 flex justify-between items-center text-xs text-muted-foreground">
        <span>12 tâches restantes</span>
        <span className="font-medium text-amber-600">En bonne voie</span>
      </div>
    </div>
  );
}
