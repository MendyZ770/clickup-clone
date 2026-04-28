"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Search, Bell } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "./breadcrumbs";
import { TimerButton } from "@/components/time-tracking/timer-button";
import { MobileSidebar } from "./mobile-sidebar";

export function TopBar() {
  const router = useRouter();
  const { data: session } = useSession();
  const { unreadCount } = useNotifications();
  const user = session?.user;

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const openSearch = () => {
    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true,
    });
    document.dispatchEvent(event);
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background px-3 md:px-4">
      {/* Left: Mobile menu + Breadcrumbs */}
      <div className="flex items-center gap-2">
        <MobileSidebar />
        <Breadcrumbs />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        <TimerButton />

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

        <Avatar
          className="ml-1 h-7 w-7"
          aria-label={user?.name ?? user?.email ?? "Utilisateur"}
          title={user?.name ?? user?.email ?? ""}
        >
          <AvatarImage src={user?.image ?? undefined} />
          <AvatarFallback className="bg-primary/20 text-[10px] text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
