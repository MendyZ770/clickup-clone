"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useUnifiedSession } from "@/hooks/use-unified-session";
import { useMobileAuth } from "@/lib/mobile-auth";
import {
  ChevronDown,
  Plus,
  Search,
  LayoutDashboard,
  Bell,
  BellOff,
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
  FileText,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { useWorkspace } from "@/hooks/use-workspace";
import { useSpaces } from "@/hooks/use-spaces";
import { useNotifications } from "@/hooks/use-notifications";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { useFavorites, type FavoriteItem } from "@/hooks/use-favorites";
import { useSidebar } from "@/hooks/use-sidebar";
import { useTheme } from "@/providers/theme-provider";
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
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
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
  const { isSupported: pushSupported, isSubscribed: pushSubscribed, subscribe: pushSubscribe, unsubscribe: pushUnsubscribe } = usePushNotifications();
  const { collapsed, toggle } = useSidebar();
  const { openCreateSpace, openCreateWorkspace } = useModal();
  const { mode, theme, setMode } = useTheme();

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
    { 
      icon: LayoutDashboard, 
      label: "Tableau de bord", 
      href: currentWorkspace ? `/workspace/${currentWorkspace.id}/dashboard` : "/dashboard",
      special: true
    },
    { icon: ClipboardList, label: "Mes tâches", href: "/my-tasks" },
    { icon: Calendar, label: "Calendrier", href: "/calendar" },
    { icon: Timer, label: "Suivi du temps", href: "/time-tracking" },
    { icon: Landmark, label: "Finance", href: "/finance" },
    { icon: Target, label: "Objectifs", href: "/goals" },
    { icon: BellRing, label: "Rappels", href: "/reminders" },
    { icon: Bell, label: "Notifications", href: "/notifications", badge: unreadCount },
    { icon: NotebookPen, label: "Notes", href: "/notes" },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href.endsWith("/dashboard")) return pathname?.endsWith("/dashboard");
    return pathname?.startsWith(href);
  };

  const sectionHeaderClass = "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 px-3 mb-1.5 flex items-center h-6";

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className="group/sidebar flex h-screen flex-col bg-sidebar/95 backdrop-blur-xl text-sidebar-foreground/80 border-r border-sidebar-border transition-all duration-300 ease-out relative z-40"
        style={{ width: collapsed ? 72 : 280, minWidth: collapsed ? 72 : 280 }}
      >
        {/* =========================================
            FIXED HEADER: Workspace Switcher 
        ========================================= */}
        <div className={cn("shrink-0 pb-2 pt-4 transition-all duration-300", collapsed ? "px-2" : "px-4")}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 rounded-xl p-2 transition-all duration-200 hover:bg-primary/10 hover:shadow-sm group/ws-btn outline-none ring-primary focus-visible:ring-2">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white shadow-sm transition-transform duration-200 group-hover/ws-btn:scale-105"
                  style={{
                    backgroundColor: currentWorkspace?.color ?? "#7C3AED",
                  }}
                >
                  {currentWorkspace?.name?.[0]?.toUpperCase() ?? "W"}
                </div>
                {!collapsed && (
                  <div className="flex flex-1 items-center justify-between min-w-0">
                    <div className="flex flex-col text-left truncate pr-2">
                      <span className="truncate text-[13px] font-medium text-foreground leading-tight">
                        {isLoading ? "Chargement..." : currentWorkspace?.name ?? "Choisir un espace"}
                      </span>
                      <span className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                        Espace de travail
                      </span>
                    </div>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-colors group-hover/ws-btn:text-primary" />
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 rounded-xl shadow-lg border-sidebar-border/50">
              <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">Espaces de travail</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {workspaces.map((ws) => (
                <DropdownMenuItem
                  key={ws.id}
                  onClick={() => setCurrentWorkspace(ws)}
                  className="flex items-center gap-3 cursor-pointer py-2 rounded-md"
                >
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-md text-[11px] font-bold text-white shadow-sm"
                    style={{ backgroundColor: ws.color ?? "#7C3AED" }}
                  >
                    {ws.name[0]?.toUpperCase()}
                  </div>
                  <span className="flex-1 truncate font-medium">{ws.name}</span>
                  {ws.id === currentWorkspace?.id && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onSelect={(e) => { e.preventDefault(); handleCreateWorkspace(); }}
                className="cursor-pointer text-primary py-2 font-medium"
              >
                <Plus className="mr-2 h-4 w-4" />
                Créer un espace
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* =========================================
            SCROLLABLE MIDDLE: Nav, Docs, Favs, Spaces 
        ========================================= */}
        <ScrollArea className="flex-1 w-full overflow-hidden">
          <div className={cn("flex flex-col gap-6 py-4", collapsed ? "px-2" : "px-4")}>
            
            {/* 1. Quick Actions */}
            <div className="flex flex-col gap-[2px]">
              {navItems.map((item) => {
                const active = isActive(item.href);
                const content = (
                  <button
                    onClick={() => {
                      if (item.label === "Rechercher") {
                        const event = new KeyboardEvent("keydown", { key: "k", metaKey: true });
                        document.dispatchEvent(event);
                        return;
                      }
                      router.push(item.href);
                    }}
                    className={cn(
                      "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200 outline-none ring-primary focus-visible:ring-2",
                      active
                        ? "bg-primary/10 text-primary shadow-sm"
                        : item.special
                          ? "bg-primary/5 text-sidebar-foreground border border-primary/10 shadow-sm hover:bg-primary/10 hover:text-primary"
                          : "text-sidebar-foreground/75 hover:bg-primary/5 hover:text-primary"
                    )}
                  >
                    <span className="relative flex items-center justify-center shrink-0">
                      <item.icon className={cn("h-[18px] w-[18px] transition-transform duration-200", active ? "scale-110" : "group-hover:scale-110")} />
                      {item.badge !== undefined && item.badge > 0 && collapsed && (
                        <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-sidebar" />
                      )}
                    </span>
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left truncate">{item.label}</span>
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white shadow-sm">
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
                      <TooltipContent side="right" className="flex items-center gap-2 rounded-lg text-xs font-medium">
                        {item.label}
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[9px] text-white">
                            {item.badge}
                          </span>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  );
                }
                return <div key={item.href}>{content}</div>;
              })}

              {/* Search Button */}
              {!collapsed && (
                <button
                  onClick={() => {
                    const event = new KeyboardEvent("keydown", { key: "k", metaKey: true });
                    document.dispatchEvent(event);
                  }}
                  className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200 text-sidebar-foreground/75 hover:bg-primary/5 hover:text-primary outline-none ring-primary focus-visible:ring-2"
                >
                  <span className="flex items-center justify-center shrink-0">
                    <Search className="h-[18px] w-[18px] transition-transform duration-200 group-hover:scale-110" />
                  </span>
                  <span className="flex-1 text-left">Rechercher</span>
                  <kbd className="pointer-events-none flex h-5 items-center gap-1 rounded bg-muted/50 px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                    <span className="text-xs">⌘</span>K
                  </kbd>
                </button>
              )}
            </div>

            {/* 2. Docs (Workspace Level) */}
            {currentWorkspace && (
              <div className="flex flex-col gap-[2px]">
                {!collapsed && <div className={sectionHeaderClass}>Connaissances</div>}
                <button
                  onClick={() => router.push(`/workspace/${currentWorkspace.id}/docs`)}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200 outline-none ring-primary focus-visible:ring-2",
                    pathname?.startsWith(`/workspace/${currentWorkspace.id}/docs`)
                      ? "bg-primary/10 text-primary shadow-sm"
                      : "text-sidebar-foreground/75 hover:bg-primary/5 hover:text-primary"
                  )}
                  title={collapsed ? "Docs" : undefined}
                >
                  <span className="flex items-center justify-center shrink-0">
                    <FileText className={cn("h-[18px] w-[18px] transition-transform duration-200", pathname?.startsWith(`/workspace/${currentWorkspace.id}/docs`) ? "scale-110" : "group-hover:scale-110")} />
                  </span>
                  {!collapsed && <span className="flex-1 text-left truncate">Documents</span>}
                </button>
              </div>
            )}

            {/* 3. Favorites */}
            {favorites.length > 0 && (
              <div className="flex flex-col gap-[2px]">
                {!collapsed && <div className={sectionHeaderClass}>Favoris</div>}
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
                    className="group flex w-full items-center gap-3 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all duration-200 text-sidebar-foreground/75 hover:bg-primary/5 hover:text-primary"
                    title={collapsed ? fav.name : undefined}
                  >
                    <span className="flex items-center justify-center shrink-0">
                      <Star className="h-[16px] w-[16px] fill-yellow-400 text-yellow-400 transition-transform duration-200 group-hover:scale-110" />
                    </span>
                    {!collapsed && <span className="flex-1 text-left truncate">{fav.name}</span>}
                  </button>
                ))}
              </div>
            )}

            {/* 4. Spaces */}
            <div className="flex flex-col">
              <div className="group/spaces flex items-center justify-between px-3 mb-1.5 h-6">
                {!collapsed && <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Espaces</span>}
                {!collapsed && (
                  <button
                    onClick={handleCreateSpace}
                    className="rounded-md p-1 opacity-0 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all duration-200 group-hover/spaces:opacity-100"
                    title="Ajouter un espace"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                )}
                {collapsed && (
                  <button onClick={handleCreateSpace} className="mx-auto rounded-md p-1 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all duration-200" title="Ajouter un espace">
                    <Plus className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="min-h-[100px] pb-6">
                {spacesLoading ? (
                  <div className="space-y-1.5 px-2 py-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-8 animate-pulse rounded-lg bg-muted/50" />
                    ))}
                  </div>
                ) : spaces.length === 0 ? (
                  !collapsed && (
                    <div className="px-3 py-6 text-center bg-muted/20 rounded-xl border border-dashed border-sidebar-border/50 mx-2">
                      <p className="text-xs text-muted-foreground font-medium mb-2">Aucun espace de travail</p>
                      <button
                        onClick={handleCreateSpace}
                        className="text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors bg-primary/10 px-3 py-1.5 rounded-full"
                      >
                        Créer le premier
                      </button>
                    </div>
                  )
                ) : (
                  <div className={collapsed ? "px-1" : "px-0"}>
                    <SidebarNav spaces={spaces} workspaceId={currentWorkspace?.id || ""} mutateSpaces={mutateSpaces} collapsed={collapsed} />
                  </div>
                )}
              </div>
            </div>

          </div>
        </ScrollArea>

        {/* =========================================
            FIXED FOOTER: Collapse & User 
        ========================================= */}
        <div className="mt-auto shrink-0 bg-sidebar/95 backdrop-blur-xl border-t border-sidebar-border/30">
          {/* Collapse Toggle */}
          <div className="px-3 py-2">
            <button
              onClick={toggle}
              className="flex w-full items-center justify-center rounded-lg px-2 py-2 text-muted-foreground transition-all duration-200 hover:bg-primary/5 hover:text-primary group/collapse"
              title={collapsed ? "Développer la barre latérale" : "Réduire la barre latérale"}
            >
              {collapsed ? (
                <PanelLeft className="h-[18px] w-[18px] transition-transform duration-200 group-hover/collapse:scale-110" />
              ) : (
                <>
                  <PanelLeftClose className="h-[18px] w-[18px] mr-2.5 transition-transform duration-200 group-hover/collapse:scale-110" />
                  <span className="text-xs font-medium">Réduire</span>
                </>
              )}
            </button>
          </div>

          <Separator className="bg-sidebar-border/30" />

          {/* User Section */}
          <div className="p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-3 rounded-xl p-2 transition-all duration-200 hover:bg-primary/5 hover:shadow-sm group/user-btn outline-none">
                  <Avatar className="h-8 w-8 shrink-0 border border-primary/10 shadow-sm transition-transform duration-200 group-hover/user-btn:scale-105">
                    <AvatarImage src={user?.image ?? undefined} />
                    <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  {!collapsed && (
                    <>
                      <div className="flex-1 text-left min-w-0 pr-2">
                        <p className="truncate text-[13px] font-semibold text-foreground leading-tight">
                          {user?.name ?? "Utilisateur"}
                        </p>
                        <p className="truncate text-[11px] text-muted-foreground leading-tight mt-0.5">
                          Mon compte
                        </p>
                      </div>
                      <Settings className="h-4 w-4 text-muted-foreground/50 shrink-0 transition-colors group-hover/user-btn:text-primary group-hover/user-btn:rotate-45" />
                    </>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="right" sideOffset={12} className="w-64 rounded-xl shadow-xl border-sidebar-border/50 p-2">
                <DropdownMenuLabel className="p-2">
                  <p className="text-sm font-semibold text-foreground">{user?.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 font-medium">{user?.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem onClick={() => router.push("/settings")} className="cursor-pointer rounded-lg py-2">
                  <Settings className="mr-2.5 h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Paramètres du compte</span>
                </DropdownMenuItem>
                {currentWorkspace && (
                  <DropdownMenuItem
                    onClick={() => router.push(`/workspace/${currentWorkspace.id}/settings`)}
                    className="cursor-pointer rounded-lg py-2"
                  >
                    <Building2 className="mr-2.5 h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Paramètres de l&apos;espace</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="cursor-pointer rounded-lg py-2">
                    {mode === "system" ? <Monitor className="mr-2.5 h-4 w-4 text-muted-foreground" /> :
                      theme === "dark" ? <Moon className="mr-2.5 h-4 w-4 text-muted-foreground" /> :
                        <Sun className="mr-2.5 h-4 w-4 text-muted-foreground" />}
                    <span className="font-medium">Thème</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent className="w-40 rounded-xl">
                      <DropdownMenuItem onClick={() => setMode("light")} className={mode === "light" ? "bg-accent" : ""}>
                        <Sun className="mr-2 h-4 w-4" /> Clair
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setMode("dark")} className={mode === "dark" ? "bg-accent" : ""}>
                        <Moon className="mr-2 h-4 w-4" /> Sombre
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setMode("system")} className={mode === "system" ? "bg-accent" : ""}>
                        <Monitor className="mr-2 h-4 w-4" /> Système
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
                {pushSupported && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault();
                      pushSubscribed ? pushUnsubscribe() : pushSubscribe();
                    }}
                    className="cursor-pointer rounded-lg py-2"
                  >
                    {pushSubscribed ? <Bell className="mr-2.5 h-4 w-4 text-primary" /> : <BellOff className="mr-2.5 h-4 w-4 text-muted-foreground" />}
                    <span className="font-medium">{pushSubscribed ? "Désactiver les notifs push" : "Activer les notifs push"}</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem
                  onClick={() => {
                    signOut({ callbackUrl: "/login" }).catch(() => {});
                    mobileLogout();
                  }}
                  className="cursor-pointer rounded-lg py-2 text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <LogOut className="mr-2.5 h-4 w-4" />
                  <span className="font-semibold">Déconnexion</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
