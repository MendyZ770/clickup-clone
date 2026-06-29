"use client";

import { useRouter } from "next/navigation";
import { Search, Bell, Sun, Moon, Monitor } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import { useTheme } from "@/providers/theme-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Breadcrumbs } from "./breadcrumbs";
import { TimerButton } from "@/components/time-tracking/timer-button";
import { MobileSidebar } from "./mobile-sidebar";
import { AccountSwitcher } from "./account-switcher";

export function TopBar() {
  const router = useRouter();
  const { unreadCount } = useNotifications();
  const { mode, theme, setMode } = useTheme();

  const openSearch = () => {
    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true,
    });
    document.dispatchEvent(event);
  };

  const themeIcon = mode === "system" ? <Monitor className="h-5 w-5" /> :
    theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />;

  const themeLabel = mode === "light" ? "Thème clair" : mode === "dark" ? "Thème sombre" : "Thème système";

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-3 pt-[env(safe-area-inset-top)] md:static md:px-4 md:pt-0">
      {/* Left: Mobile menu + Breadcrumbs */}
      <div className="flex items-center gap-2">
        <MobileSidebar />
        <Breadcrumbs />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-0.5 sm:gap-1">
        <TimerButton />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
              aria-label={themeLabel}
              title={themeLabel}
            >
              {themeIcon}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem
              onClick={() => setMode("light")}
              className={mode === "light" ? "bg-accent" : ""}
            >
              <Sun className="mr-2 h-4 w-4" />
              Clair
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setMode("dark")}
              className={mode === "dark" ? "bg-accent" : ""}
            >
              <Moon className="mr-2 h-4 w-4" />
              Sombre
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setMode("system")}
              className={mode === "system" ? "bg-accent" : ""}
            >
              <Monitor className="mr-2 h-4 w-4" />
              Système
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-foreground"
          onClick={openSearch}
          aria-label="Rechercher (⌘K)"
          title="Rechercher (⌘K)"
        >
          <Search className="h-5 w-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 text-muted-foreground hover:text-foreground"
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
              className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white"
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
