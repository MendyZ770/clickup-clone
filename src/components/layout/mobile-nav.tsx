"use client";

import { useRouter, usePathname } from "next/navigation";
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
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 w-full h-full rounded-lg mx-0.5 transition-all duration-200",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              <span className="relative">
                <item.icon className={cn("h-[22px] w-[22px]", isActive && "stroke-[2.5]")} />
                {showBadge && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </span>
              <span className="text-[11px] font-medium leading-tight">{item.label}</span>
              {isActive && (
                <span className="absolute bottom-1.5 h-[3px] w-5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
