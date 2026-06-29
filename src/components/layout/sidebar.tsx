"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useUnifiedSession } from "@/hooks/use-unified-session";
import { useMobileAuth } from "@/lib/mobile-auth";
import {
  ChevronDown,
  Plus,
  Search,
  LayoutDashboard,
  Bell,
  LogOut,
  Settings,
  Building2,
  ChevronsUpDown,
  Check,
  CalendarSync,
  Calendar,
  Timer,
  Target,
  BellRing,
  Star,
  ClipboardList,
  NotebookPen,
  PanelLeft,
  PanelLeftClose,
  Landmark,
} from "lucide-react";
import { useWorkspace } from "@/hooks/use-workspace";
import { useSpaces } from "@/hooks/use-spaces";
import { useNotifications } from "@/hooks/use-notifications";
import { useFavorites, type FavoriteItem } from "@/hooks/use-favorites";
import { useSidebar } from "@/hooks/use-sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarNav } from "./sidebar-nav";
import { useModal } from "@/providers/modal-provider";

export function Sidebar({ onCloseSheet }: { onCloseSheet?: () => void } = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user: sessionUser } = useUnifiedSession();
  const { logout: mobileLogout } = useMobileAuth();
  const { currentWorkspace, workspaces, setCurrentWorkspace, isLoading } =
    useWorkspace();
  const { spaces, isLoading: spacesLoading, mutate: mutateSpaces } =
    useSpaces(currentWorkspace?.id);
  const { favorites } = useFavorites(currentWorkspace?.id);
  const { unreadCount } = useNotifications();
  const { collapsed, toggle } = useSidebar();
  const { openCreateSpace, openCreateWorkspace } = useModal();

  const handleCreateSpace = () => {
    if (!currentWorkspace) return;
    if (onCloseSheet) {
      onCloseSheet();
      setTimeout(() => openCreateSpace(currentWorkspace.id), 250);
    } else {
      openCreateSpace(currentWorkspace.id);
    }
  };

  const handleCreateWorkspace = () => {
    if (onCloseSheet) {
      onCloseSheet();
      setTimeout(() => openCreateWorkspace(), 250);
    } else {
      openCreateWorkspace();
    }
  };

  const user = sessionUser;
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || "?";

  const navItems = [
    { icon: LayoutDashboard, label: "Tableau de bord", href: "/dashboard" },
    { icon: ClipboardList, label: "Mes tâches", href: "/my-tasks" },
    { icon: Calendar, label: "Calendrier", href: "/calendar" },
    { icon: Timer, label: "Suivi du temps", href: "/time-tracking" },
    { icon: Landmark, label: "Finance", href: "/finance" },
    { icon: Target, label: "Objectifs", href: "/goals" },
    { icon: BellRing, label: "Rappels", href: "/reminders" },
    { icon: Bell, label: "Notifications", href: "/notifications", badge: unreadCount },
    { icon: CalendarSync, label: "Sync calendrier", href: "/dashboard/calendar-settings" },
    { icon: NotebookPen, label: "Notes", href: "/notes" },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname?.startsWith(href);
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className="group/sidebar flex h-screen flex-col bg-sidebar text-sidebar-foreground/80 border-r border-sidebar-border transition-[width] duration-300 ease-in-out relative overflow-hidden"
        style={{ width: collapsed ? 72 : 300, minWidth: collapsed ? 72 : 300 }}
      >
        {/* Workspace Switcher */}
        <div className="flex items-center px-2 pt-3 pb-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-sm font-semibold text-sidebar-foreground transition-colors hover:bg-sidebar-accent">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-sm font-bold text-white"
                  style={{
                    backgroundColor: currentWorkspace?.color ?? "#7C3AED",
                  }}
                >
                  {currentWorkspace?.name?.[0]?.toUpperCase() ?? "W"}
                </div>
                {!collapsed && (
                  <>
                    <span className="flex-1 truncate text-left">
                      {isLoading ? "Chargement..." : currentWorkspace?.name ?? "Choisir un espace"}
                    </span>
                    <ChevronsUpDown className="h-5 w-5 shrink-0 text-muted-foreground" />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuLabel>Espaces de travail</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {workspaces.map((ws) => (
                <DropdownMenuItem
                  key={ws.id}
                  onClick={() => setCurrentWorkspace(ws)}
                  className="flex items-center gap-2"
                >
                  <div
                    className="flex h-6 w-6 items-center justify-center rounded text-[11px] font-bold text-white"
                    style={{ backgroundColor: ws.color ?? "#7C3AED" }}
                  >
                    {ws.name[0]?.toUpperCase()}
                  </div>
                  <span className="flex-1 truncate">{ws.name}</span>
                  {ws.id === currentWorkspace?.id && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleCreateWorkspace(); }}>
                <Plus className="mr-2 h-5 w-5" />
                Créer un espace de travail
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Separator className="bg-sidebar-border" />

        {/* Quick Actions */}
        <div className="space-y-0.5 px-2 pt-3 pb-2">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const content = (
              <button
                onClick={() => {
                  if (item.label === "Rechercher") {
                    const event = new KeyboardEvent("keydown", {
                      key: "k",
                      metaKey: true,
                    });
                    document.dispatchEvent(event);
                    return;
                  }
                  router.push(item.href);
                }}
                className={
                  "relative flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-sm transition-all duration-200 " +
                  (active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground")
                }
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full bg-primary" />
                )}
                <span className="relative flex items-center justify-center shrink-0" style={{ width: 24, height: 24 }}>
                  <item.icon className="h-[22px] w-[22px]" />
                  {item.badge !== undefined && item.badge > 0 && collapsed && (
                    <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-primary ring-2 ring-sidebar" />
                  )}
                </span>
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left truncate">{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-primary px-1 text-[11px] font-medium text-white">
                        {item.badge > 99 ? "99+" : item.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{content}</TooltipTrigger>
                  <TooltipContent side="right" className="flex items-center gap-2">
                    {item.label}
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-white">
                        {item.badge}
                      </span>
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            }
            return <div key={item.href}>{content}</div>;
          })}
          {!collapsed && (
            <button
              onClick={() => {
                const event = new KeyboardEvent("keydown", {
                  key: "k",
                  metaKey: true,
                });
                document.dispatchEvent(event);
              }}
              className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground text-sidebar-foreground/70"
            >
              <Search className="h-[22px] w-[22px]" />
              <span className="flex-1 text-left">Rechercher</span>
              <kbd className="pointer-events-none rounded bg-sidebar-accent px-1.5 py-0.5 text-[11px] text-muted-foreground">
                ⌘K
              </kbd>
            </button>
          )}
        </div>

        <Separator className="bg-sidebar-border" />

        {/* Favorites */}
        {favorites.length > 0 && !collapsed && (
          <>
            <div className="px-5 pt-3 pb-1">
              <span className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                Favoris
              </span>
            </div>
            <div className="space-y-0.5 px-2 pb-2">
              {favorites.map((fav: FavoriteItem) => (
                <button
                  key={fav.id}
                  onClick={() => {
                    if (fav.type === "space" && currentWorkspace) {
                      router.push(`/workspace/${currentWorkspace.id}/space/${fav.spaceId}`);
                    } else if (fav.type === "list" && currentWorkspace) {
                      router.push(`/workspace/${currentWorkspace.id}/space/${fav.spaceId}/list/${fav.targetId}/list-view`);
                    } else if (fav.type === "task") {
                      router.push(`/task/${fav.targetId}`);
                    }
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground text-sidebar-foreground/70"
                >
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 shrink-0" />
                  <span className="truncate">{fav.name}</span>
                </button>
              ))}
            </div>
            <Separator className="bg-sidebar-border" />
          </>
        )}

        {/* Spaces Header */}
        <div className="flex items-center justify-between px-3 pt-3 pb-1">
          {!collapsed && (
            <span className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
              Espaces
            </span>
          )}
          <button
            onClick={handleCreateSpace}
            className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
            title="Ajouter un espace"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Navigation Tree */}
        <ScrollArea className="flex-1 px-1">
          <div className="py-1">
            {spacesLoading ? (
              <div className="space-y-2 px-2 py-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-7 animate-pulse rounded bg-sidebar-accent/50"
                  />
                ))}
              </div>
            ) : spaces.length === 0 ? (
              !collapsed && (
                <div className="px-2 py-4 text-center">
                  <p className="text-xs text-muted-foreground">Aucun espace</p>
                  <button
                    onClick={handleCreateSpace}
                    className="mt-1 text-xs text-primary hover:underline"
                  >
                    Créer votre premier espace
                  </button>
                </div>
              )
            ) : (
              <SidebarNav spaces={spaces} workspaceId={currentWorkspace!.id} mutateSpaces={mutateSpaces} collapsed={collapsed} />
            )}
          </div>
        </ScrollArea>

        <Separator className="bg-sidebar-border" />

        {/* Collapse Toggle */}
        <div className="px-2 py-1.5">
          <button
            onClick={toggle}
            className="flex w-full items-center justify-center rounded-md px-2 py-1.5 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
            title={collapsed ? "Développer" : "Réduire"}
          >
            {collapsed ? (
              <PanelLeft className="h-5 w-5" />
            ) : (
              <>
                <PanelLeftClose className="h-5 w-5 mr-2" />
                <span className="text-xs">Réduire</span>
              </>
            )}
          </button>
        </div>

        <Separator className="bg-sidebar-border" />

        {/* User Section */}
        <div className="p-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-sidebar-accent">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={user?.image ?? undefined} />
                  <AvatarFallback className="bg-primary/20 text-[12px] text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <>
                    <div className="flex-1 text-left min-w-0">
                      <p className="truncate text-sm font-medium text-sidebar-foreground">
                        {user?.name ?? "User"}
                      </p>
                    </div>
                    <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top" className="w-56">
              <DropdownMenuLabel>
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/settings")}>
                <Settings className="mr-2 h-5 w-5" />
                Paramètres
              </DropdownMenuItem>
              {currentWorkspace && (
                <DropdownMenuItem
                  onClick={() => router.push(`/workspace/${currentWorkspace.id}/settings`)}
                >
                  <Building2 className="mr-2 h-5 w-5" />
                  Paramètres de l&apos;espace
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  signOut({ callbackUrl: "/login" }).catch(() => {});
                  mobileLogout();
                }}
                className="text-red-400 focus:text-red-400"
              >
                <LogOut className="mr-2 h-5 w-5" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

    </TooltipProvider>
  );
}
