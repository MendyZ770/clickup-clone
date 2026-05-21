"use client";

import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  ClipboardList,
  Calendar,
  Timer,
  Bell,
  Settings,
  Landmark,
} from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: ClipboardList, label: "Tâches", href: "/my-tasks" },
  { icon: Calendar, label: "Calendrier", href: "/calendar" },
  { icon: Landmark, label: "Finance", href: "/finance" },
  { icon: Timer, label: "Timer", href: "/time-tracking" },
  { icon: Bell, label: "Notifs", href: "/notifications" },
  { icon: Settings, label: "Réglages", href: "/settings" },
];

export function MobileNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { unreadCount } = useNotifications();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 safe-area-pb">
      <div className="flex items-center justify-around h-16 px-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          const showBadge = item.href === "/notifications" && unreadCount > 0;
          return (
            <motion.button
              key={item.href}
              onClick={() => router.push(item.href)}
              whileTap={{ scale: 0.9 }}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 w-full h-full rounded-lg mx-0.5 transition-all duration-200",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              <span className="relative">
                <motion.div
                  whileHover={{ scale: 1.15 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                >
                  <item.icon className={cn("h-6 w-6", isActive && "stroke-[2.5]")} />
                </motion.div>
                {showBadge && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -right-2 -top-1.5 flex h-5 min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white"
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </motion.span>
                )}
              </span>
              <span className="text-xs font-medium leading-tight">{item.label}</span>
              {isActive && (
                <motion.span
                  layoutId="mobile-nav-indicator"
                  className="absolute bottom-1.5 h-[3px] w-5 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
