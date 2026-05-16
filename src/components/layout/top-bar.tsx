"use client";

import { useRouter } from "next/navigation";
import { Search, Bell, Sun, Moon } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import { useTheme } from "@/providers/theme-provider";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "./breadcrumbs";
import { TimerButton } from "@/components/time-tracking/timer-button";
import { MobileSidebar } from "./mobile-sidebar";
import { AccountSwitcher } from "./account-switcher";

export function TopBar() {
  const router = useRouter();
  const { unreadCount } = useNotifications();
  const { theme, toggleTheme } = useTheme();

  const openSearch = () => {
    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true,
    });
    document.dispatchEvent(event);
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-3 md:static md:px-4">
      {/* Left: Mobile menu + Breadcrumbs */}
      <div className="flex items-center gap-2">
        <MobileSidebar />
        <Breadcrumbs />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-0.5 sm:gap-1">
        <TimerButton />

        <Button
          variant="ghost"
          size="icon"
          className="hidden sm:inline-flex h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
          title={theme === "dark" ? "Mode clair" : "Mode sombre"}
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={openSearch}
          aria-label="Rechercher (⌘K)"
          title="Rechercher (⌘K)"
        >
          <Search className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={() => router.push("/notifications")}
          aria-label={
            unreadCount > 0
              ? `Notifications (${unreadCount} non lue${unreadCount > 1 ? "s" : ""})`
              : "Notifications"
          }
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span
              className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white"
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
