"use client";

import { useMemo } from "react";
import useSWR, { useSWRConfig } from "swr";
import { useSession } from "next-auth/react";
import { LayoutDashboard, Zap, Calendar, ListTodo, Plus, Sparkles, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, Variants } from "framer-motion";
import dynamic from "next/dynamic";

import { useWorkspace } from "@/hooks/use-workspace";
import { useBudgets } from "@/hooks/use-budgets";
import { useModal } from "@/providers/modal-provider";
import { Button } from "@/components/ui/button";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { UpcomingDeadlines } from "@/components/dashboard/upcoming-deadlines";
import { cn } from "@/lib/utils";

const TasksByStatusChart = dynamic(
  () => import("@/components/dashboard/tasks-by-status-chart").then((mod) => mod.TasksByStatusChart),
  { ssr: false, loading: () => <div className="h-[300px] rounded-3xl border border-white/5 bg-card/40 animate-pulse" /> }
);
const TasksByPriorityChart = dynamic(
  () => import("@/components/dashboard/tasks-by-priority-chart").then((mod) => mod.TasksByPriorityChart),
  { ssr: false, loading: () => <div className="h-[300px] rounded-3xl border border-white/5 bg-card/40 animate-pulse" /> }
);
const BudgetWidget = dynamic(
  () => import("@/components/dashboard/budget-widget").then((mod) => mod.BudgetWidget),
  { ssr: false, loading: () => <div className="h-[300px] rounded-3xl border border-white/5 bg-card/40 animate-pulse" /> }
);
const FinanceWidget = dynamic(
  () => import("@/components/dashboard/finance-widget").then((mod) => mod.FinanceWidget),
  { ssr: false, loading: () => <div className="h-[300px] rounded-3xl border border-white/5 bg-card/40 animate-pulse" /> }
);

const fetcher = (url: string) => fetch(url).then((r) => {
  if (!r.ok) throw new Error("Failed to fetch");
  return r.json();
});

interface DashboardData {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  tasksDueThisWeek: number;
  tasksByStatus: { name: string; color: string; count: number }[];
  tasksByPriority: { priority: string; count: number }[];
  recentActivities: any[];
  upcomingDeadlines: any[];
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const { currentWorkspace, isLoading: workspaceLoading } = useWorkspace();
  const router = useRouter();
  const { mutate: globalMutate } = useSWRConfig();
  const { budgets: workspaceBudgets, isLoading: budgetsLoading } = useBudgets(currentWorkspace?.id);
  const { openCreateTask } = useModal();

  const { data, isLoading: dataLoading } = useSWR<DashboardData>(
    currentWorkspace ? `/api/dashboard/stats?workspaceId=${currentWorkspace.id}` : null,
    fetcher,
    { refreshInterval: 300000, dedupingInterval: 10000, keepPreviousData: true }
  );

  const isLoading = workspaceLoading || dataLoading;

  const handleTaskCreated = () => {
    if (currentWorkspace) {
      globalMutate(`/api/dashboard/stats?workspaceId=${currentWorkspace.id}`);
    }
  };

  const statsData = useMemo(() => ({
    totalTasks: data?.totalTasks ?? 0,
    completedTasks: data?.completedTasks ?? 0,
    overdueTasks: data?.overdueTasks ?? 0,
    tasksDueThisWeek: data?.tasksDueThisWeek ?? 0,
  }), [data]);

  const productivityScore = useMemo(() => {
    const total = data?.totalTasks ?? 0;
    const completed = data?.completedTasks ?? 0;
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  }, [data]);

  const tasksByStatus = useMemo(() => Array.isArray(data?.tasksByStatus) ? data.tasksByStatus : [], [data]);
  const tasksByPriority = useMemo(() => Array.isArray(data?.tasksByPriority) ? data.tasksByPriority : [], [data]);
  const recentActivities = useMemo(() => Array.isArray(data?.recentActivities) ? data.recentActivities : [], [data]);
  const upcomingDeadlines = useMemo(() => Array.isArray(data?.upcomingDeadlines) ? data.upcomingDeadlines : [], [data]);

  if (isLoading && !currentWorkspace) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background/50 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex h-16 w-16 items-center justify-center">
            <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin" />
            <div className="h-8 w-8 rounded-full bg-primary/20 animate-pulse" />
          </div>
          <p className="text-sm font-medium text-muted-foreground tracking-widest uppercase">Chargement...</p>
        </div>
      </div>
    );
  }

  const firstName = session?.user?.name?.split(" ")[0] || "L'équipe";

  return (
    <div className="min-h-screen bg-background/50 dark:bg-background/20 relative overflow-hidden">
      {/* Subtle Background Glows */}
      <div className="pointer-events-none absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[100px] dark:bg-primary/10" />
      <div className="pointer-events-none absolute top-40 -left-40 h-[400px] w-[400px] rounded-full bg-blue-500/5 blur-[100px] dark:bg-blue-500/10" />
      
      <div className="mx-auto max-w-7xl p-4 md:p-8 space-y-6 md:space-y-8 relative z-10">
        
        {/* HERO SECTION */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6"
        >
          <div className="space-y-2">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary backdrop-blur-md mb-2">
              <Sparkles className="mr-1.5 h-4 w-4" />
              Vue d'ensemble de {currentWorkspace?.name}
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
              Bonjour, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">{firstName}</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl">
              Voici ce qui se passe dans votre espace de travail aujourd'hui. Vous avez accompli {data?.completedTasks ?? 0} tâches !
            </p>
          </div>
          
          <Button
            size="lg"
            className="rounded-full shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:-translate-y-0.5 font-semibold px-6"
            onClick={() => currentWorkspace && openCreateTask(currentWorkspace.id, undefined, handleTaskCreated)}
          >
            <Plus className="mr-2 h-5 w-5" /> Nouvelle tâche
          </Button>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6"
        >
          {/* 1. Stats Cards (Span 12) */}
          <motion.div variants={itemVariants} className="md:col-span-12">
            <StatsCards {...statsData} isLoading={isLoading} onCardClick={() => router.push("/my-tasks")} />
          </motion.div>

          {/* 2. Deadlines Row */}
          <motion.div variants={itemVariants} className="md:col-span-12 h-[450px]">
            <UpcomingDeadlines tasks={upcomingDeadlines} isLoading={isLoading} />
          </motion.div>

          {/* 3. Finance & Budget Row */}
          <motion.div variants={itemVariants} className="md:col-span-6 h-[420px]">
            <FinanceWidget workspaceId={currentWorkspace?.id} />
          </motion.div>
          
          <motion.div variants={itemVariants} className="md:col-span-6 h-[420px]">
            <BudgetWidget budgets={workspaceBudgets} isLoading={budgetsLoading} />
          </motion.div>

          {/* 4. Bento Box: Productivity & Quick Actions (Span 12) */}
          <motion.div variants={itemVariants} className="md:col-span-12 grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
            
            {/* Productivity Gauge */}
            <div className="md:col-span-4 relative overflow-hidden rounded-[2rem] border border-border/30 bg-card/40 backdrop-blur-xl p-6 flex flex-col justify-center items-center shadow-xl shadow-black/5 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative h-32 w-32 shrink-0 flex items-center justify-center mb-4">
                <svg viewBox="0 0 36 36" className="absolute inset-0 h-32 w-32 -rotate-90 filter drop-shadow-md">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-muted/30"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeDasharray={`${productivityScore}, 100`}
                    strokeLinecap="round"
                    className="text-primary transition-all duration-1500 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70 tracking-tighter">
                    {productivityScore}%
                  </span>
                </div>
              </div>
              <div className="text-center z-10">
                <h3 className="text-lg font-bold tracking-tight">Score de Productivité</h3>
                <p className="text-sm text-muted-foreground mt-1">Vous êtes en pleine forme !</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
              {[
                { href: "/my-tasks", icon: ListTodo, color: "blue", label: "Mes tâches", sub: `${statsData.totalTasks} en cours` },
                { href: "/calendar", icon: Calendar, color: "amber", label: "Calendrier", sub: "Planifiez votre temps" },
                { href: "/reminders", icon: Zap, color: "purple", label: "Rappels", sub: "Ne rien oublier" },
              ].map((item, idx) => (
                <Link
                  key={idx}
                  href={item.href}
                  className={cn(
                    "relative overflow-hidden flex flex-col items-start justify-between rounded-[2rem] border border-border/30 bg-card/40 backdrop-blur-xl p-6 shadow-xl shadow-black/5",
                    "hover:-translate-y-1 hover:shadow-2xl transition-all duration-500 group"
                  )}
                >
                  <div className={`absolute -right-8 -top-8 h-32 w-32 rounded-full bg-${item.color}-500/10 blur-[40px] group-hover:bg-${item.color}-500/20 transition-colors duration-500`} />
                  <div className={`relative h-14 w-14 rounded-2xl bg-${item.color}-500/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-${item.color}-500/20 transition-all duration-500 shadow-inner`}>
                    <item.icon className={`h-7 w-7 text-${item.color}-500`} />
                  </div>
                  <div className="mt-8 relative z-10">
                    <h3 className="text-lg font-bold text-foreground/90 group-hover:text-foreground transition-colors">{item.label}</h3>
                    <p className="text-sm font-medium text-muted-foreground">{item.sub}</p>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>

          {/* 5. Charts Row */}
          <motion.div variants={itemVariants} className="md:col-span-7 h-[420px]">
            <TasksByStatusChart data={tasksByStatus} isLoading={isLoading} />
          </motion.div>
          
          <motion.div variants={itemVariants} className="md:col-span-5 h-[420px]">
            <TasksByPriorityChart data={tasksByPriority} isLoading={isLoading} />
          </motion.div>

          {/* 6. Recent Activity Row */}
          <motion.div variants={itemVariants} className="md:col-span-12 h-[450px]">
            <RecentActivity activities={recentActivities} isLoading={isLoading} />
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
}
