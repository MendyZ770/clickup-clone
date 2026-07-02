"use client";

import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  ClipboardList,
  Calendar,
  Timer,
  Landmark,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Home", href: "/dashboard" },
  { icon: ClipboardList, label: "Tâches", href: "/my-tasks" },
  { icon: Calendar, label: "Agenda", href: "/calendar" },
  { icon: Landmark, label: "Finance", href: "/finance" },
  { icon: Timer, label: "Timer", href: "/time-tracking" },
];

export function MobileNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-4 right-4 z-50 rounded-[2rem] border border-white/10 dark:border-white/5 bg-background/60 dark:bg-background/40 backdrop-blur-2xl shadow-2xl shadow-black/20">
      <div className="flex items-center justify-around h-16 px-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <motion.button
              key={item.href}
              onClick={() => router.push(item.href)}
              whileTap={{ scale: 0.9 }}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 min-w-[60px] h-14 rounded-2xl transition-all duration-300",
                isActive
                  ? "text-primary bg-primary/15 shadow-inner"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
            >
              <item.icon className={cn("h-5 w-5 transition-transform duration-300", isActive && "stroke-[2.5] scale-110")} />
              <span className={cn("text-[10px] font-semibold leading-tight transition-all duration-300", isActive ? "opacity-100" : "opacity-70")}>{item.label}</span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
