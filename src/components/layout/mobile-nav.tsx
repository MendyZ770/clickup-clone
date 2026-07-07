"use client";

import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
    <nav className="md:hidden fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm z-50 rounded-[2.5rem] border border-white/20 dark:border-white/10 bg-background/50 dark:bg-background/30 backdrop-blur-3xl shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
      <div className="flex items-center justify-between h-[4.5rem] px-2 relative">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <motion.button
              key={item.href}
              onClick={() => router.push(item.href)}
              whileTap={{ scale: 0.85 }}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 w-full h-14 rounded-full transition-colors duration-300 z-10",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-active-indicator"
                  className="absolute inset-0 bg-primary/15 rounded-[2rem] -z-10 shadow-inner"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <item.icon className={cn("h-[22px] w-[22px] transition-transform duration-300", isActive && "stroke-[2.5] scale-110")} />
              <span className={cn("text-[9px] font-bold leading-tight transition-all duration-300 tracking-wide", isActive ? "opacity-100" : "opacity-0 translate-y-1 absolute bottom-1")}>
                {isActive ? item.label : ""}
              </span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
