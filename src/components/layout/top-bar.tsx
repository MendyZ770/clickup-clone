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


  const openSearch = () => {
    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true,
    });
    document.dispatchEvent(event);
  };


  return (
    <header className="sticky top-0 z-40 flex h-[calc(4rem+env(safe-area-inset-top))] shrink-0 items-center justify-between border-b border-border/30 bg-background/40 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/20 px-3 pt-[env(safe-area-inset-top)] md:static md:h-16 md:px-4 md:pt-0">
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
          className="h-11 w-11 md:h-9 md:w-9 text-muted-foreground hover:text-foreground"
          onClick={openSearch}
          aria-label="Rechercher (⌘K)"
          title="Rechercher (⌘K)"
        >
          <Search className="h-5 w-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="relative h-11 w-11 md:h-9 md:w-9 text-muted-foreground hover:text-foreground"
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
