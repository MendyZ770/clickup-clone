"use client";

import { useRouter, usePathname } from "next/navigation";
import { Search, Bell } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "./breadcrumbs";
import { TimerButton } from "@/components/time-tracking/timer-button";
import { MobileSidebar } from "./mobile-sidebar";
import { AccountSwitcher } from "./account-switcher";
import { AnimatePresence, motion } from "framer-motion";

const routeLabels: Record<string, string> = {
  dashboard: "Tableau de bord",
  finance: "Finance",
  budget: "Budget",
  notifications: "Notifications",
  settings: "Paramètres",
  spaces: "Espaces",
  folders: "Dossiers",
  lists: "Listes",
  tasks: "Tâches",
  calendar: "Agenda",
  "time-tracking": "Suivi du temps",
  "my-tasks": "Mes tâches",
  reminders: "Rappels",
  notes: "Notes",
  goals: "Objectifs",
};

function getMobilePageTitle(pathname: string | null): string {
  if (!pathname || pathname === "/") return "Accueil";
  const parts = pathname.split("/").filter(Boolean);
  const lastPart = parts[parts.length - 1];
  if (routeLabels[lastPart]) return routeLabels[lastPart];
  // If the last part is an ID, use the second to last part
  const secondLastPart = parts[parts.length - 2];
  if (secondLastPart && routeLabels[secondLastPart]) return routeLabels[secondLastPart];
  return "Détails";
}

export function TopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { unreadCount } = useNotifications();
  const mobileTitle = getMobilePageTitle(pathname);

  const openSearch = () => {
    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true,
    });
    document.dispatchEvent(event);
  };

  return (
    <header className="sticky top-0 z-40 flex h-[calc(4rem+env(safe-area-inset-top))] shrink-0 items-center justify-between border-b border-white/5 bg-background/50 backdrop-blur-3xl supports-[backdrop-filter]:bg-background/40 px-3 pt-[env(safe-area-inset-top)] md:static md:h-16 md:px-4 md:pt-0 shadow-sm md:shadow-none">
      {/* Left: Mobile menu + Breadcrumbs/Title */}
      <div className="flex items-center gap-3">
        <MobileSidebar />
        <Breadcrumbs />
        
        {/* Mobile Dynamic Title */}
        <AnimatePresence mode="popLayout">
          <motion.h1
            key={mobileTitle}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
            className="md:hidden text-lg font-bold tracking-tight text-foreground"
          >
            {mobileTitle}
          </motion.h1>
        </AnimatePresence>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-0.5 sm:gap-1">
        <TimerButton />

        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 md:h-9 md:w-9 text-muted-foreground hover:text-foreground"
          onClick={openSearch}
          aria-label="Rechercher (⌘K)"
          title="Rechercher (⌘K)"
        >
          <Search className="h-5 w-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 md:h-9 md:w-9 text-muted-foreground hover:text-foreground"
          onClick={() => router.push("/notifications")}
          aria-label={
            unreadCount > 0
              ? `Notifications (${unreadCount} non lue${unreadCount > 1 ? "s" : ""})`
              : "Notifications"
          }
          title="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span
              className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white ring-2 ring-background"
              aria-hidden="true"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>

        <AccountSwitcher />
      </div>
    </header>
  );
}
