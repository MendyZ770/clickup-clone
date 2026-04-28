"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  ChevronDown,
  Plus,
  Search,
  LayoutDashboard,
  Bell,
  LogOut,
  Settings,
  ChevronsUpDown,
  Check,
  CalendarSync,
  Calendar,
  Timer,
  Target,
  BellRing,
  Star,
  ClipboardList,
} from "lucide-react";
import { useWorkspace } from "@/hooks/use-workspace";
import { useSpaces } from "@/hooks/use-spaces";
import { useNotifications } from "@/hooks/use-notifications";
import { useFavorites, type FavoriteItem } from "@/hooks/use-favorites";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarNav } from "./sidebar-nav";
import { CreateSpaceDialog } from "@/components/space/create-space-dialog";
import { CreateWorkspaceDialog } from "@/components/workspace/create-workspace-dialog";

export function Sidebar() {
  const router = useRouter();
  const { data: session } = useSession();
  const { currentWorkspace, workspaces, setCurrentWorkspace, isLoading } =
    useWorkspace();
  const { spaces, isLoading: spacesLoading, mutate: mutateSpaces } =
    useSpaces(currentWorkspace?.id);
  const { favorites } = useFavorites(currentWorkspace?.id);
  const { unreadCount } = useNotifications();
  const [createSpaceOpen, setCreateSpaceOpen] = useState(false);
  const [createWorkspaceOpen, setCreateWorkspaceOpen] = useState(false);

  const user = session?.user;
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <>
      <aside className="flex h-screen w-[260px] min-w-[260px] flex-col bg-sidebar text-sidebar-foreground/80 border-r border-sidebar-border">
        {/* Workspace Switcher */}
        <div className="flex items-center px-3 pt-3 pb-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-sm font-semibold text-sidebar-foreground transition-colors hover:bg-sidebar-accent">
                <div
                  className="flex h-6 w-6 items-center justify-center rounded text-[11px] font-bold text-white"
                  style={{
                    backgroundColor: currentWorkspace?.color ?? "#7C3AED",
                  }}
                >
                  {currentWorkspace?.name?.[0]?.toUpperCase() ?? "W"}
                </div>
                <span className="flex-1 truncate text-left">
                  {isLoading ? "Chargement..." : currentWorkspace?.name ?? "Choisir un espace"}
                </span>
                <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
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
                    className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold text-white"
                    style={{ backgroundColor: ws.color ?? "#7C3AED" }}
                  >
                    {ws.name[0]?.toUpperCase()}
                  </div>
                  <span className="flex-1 truncate">{ws.name}</span>
                  {ws.id === currentWorkspace?.id && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setCreateWorkspaceOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Créer un espace de travail
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Separator className="bg-sidebar-border" />

        {/* Quick Actions */}
        <div className="space-y-0.5 px-3 pt-3 pb-2">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <LayoutDashboard className="h-4 w-4" />
            Tableau de bord
          </button>
          <button
            onClick={() => router.push("/my-tasks")}
            className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <ClipboardList className="h-4 w-4" />
            Mes tâches
          </button>
          <button
            onClick={() => {
              const event = new KeyboardEvent("keydown", {
                key: "k",
                metaKey: true,
              });
              document.dispatchEvent(event);
            }}
            className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <Search className="h-4 w-4" />
            <span className="flex-1 text-left">Rechercher</span>
            <kbd className="pointer-events-none rounded bg-sidebar-accent px-1.5 py-0.5 text-[10px] text-muted-foreground">
              ⌘K
            </kbd>
          </button>
          <button
            onClick={() => router.push("/notifications")}
            className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <Bell className="h-4 w-4" />
            <span className="flex-1 text-left">Notifications</span>
            {unreadCount > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => router.push("/calendar")}
            className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <Calendar className="h-4 w-4" />
            Calendrier
          </button>
          <button
            onClick={() => router.push("/time-tracking")}
            className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <Timer className="h-4 w-4" />
            Suivi du temps
          </button>
          <button
            onClick={() => router.push("/goals")}
            className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <Target className="h-4 w-4" />
            Objectifs
          </button>
          <button
            onClick={() => router.push("/reminders")}
            className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <BellRing className="h-4 w-4" />
            Rappels
          </button>
          <button
            onClick={() => router.push("/dashboard/calendar-settings")}
            className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <CalendarSync className="h-4 w-4" />
            Sync calendrier
          </button>
        </div>

        <Separator className="bg-sidebar-border" />

        {/* Favorites */}
        {favorites.length > 0 && (
          <>
            <div className="px-5 pt-3 pb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Favoris
              </span>
            </div>
            <div className="space-y-0.5 px-3 pb-2">
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
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 shrink-0" />
                  <span className="truncate">{fav.name}</span>
                </button>
              ))}
            </div>
            <Separator className="bg-sidebar-border" />
          </>
        )}

        {/* Spaces Header */}
        <div className="flex items-center justify-between px-5 pt-3 pb-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Espaces
          </span>
          <button
            onClick={() => setCreateSpaceOpen(true)}
            className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
            title="Ajouter un espace"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Scrollable Navigation Tree */}
        <ScrollArea className="flex-1 px-2">
          <div className="py-1">
            {spacesLoading ? (
              <div className="space-y-2 px-3 py-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-7 animate-pulse rounded bg-sidebar-accent/50"
                  />
                ))}
              </div>
            ) : spaces.length === 0 ? (
              <div className="px-3 py-4 text-center">
                <p className="text-xs text-muted-foreground">Aucun espace</p>
                <button
                  onClick={() => setCreateSpaceOpen(true)}
                  className="mt-1 text-xs text-primary hover:underline"
                >
                  Créer votre premier espace
                </button>
              </div>
            ) : (
              <SidebarNav spaces={spaces} workspaceId={currentWorkspace!.id} mutateSpaces={mutateSpaces} />
            )}
          </div>
        </ScrollArea>

        <Separator className="bg-sidebar-border" />

        {/* User Section */}
        <div className="p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-sidebar-accent">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={user?.image ?? undefined} />
                  <AvatarFallback className="bg-primary/20 text-[11px] text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="truncate text-sm font-medium text-sidebar-foreground">
                    {user?.name ?? "User"}
                  </p>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top" className="w-56">
              <DropdownMenuLabel>
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                Paramètres
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-red-400 focus:text-red-400"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Dialogs */}
      {currentWorkspace && (
        <CreateSpaceDialog
          open={createSpaceOpen}
          onOpenChange={setCreateSpaceOpen}
          workspaceId={currentWorkspace.id}
          onCreated={() => mutateSpaces()}
        />
      )}
      <CreateWorkspaceDialog
        open={createWorkspaceOpen}
        onOpenChange={setCreateWorkspaceOpen}
      />
    </>
  );
}
