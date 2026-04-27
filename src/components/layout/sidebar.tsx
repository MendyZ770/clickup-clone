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
} from "lucide-react";
import { useWorkspace } from "@/hooks/use-workspace";
import { useSpaces } from "@/hooks/use-spaces";
import { useNotifications } from "@/hooks/use-notifications";
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
      <aside className="flex h-screen w-[260px] min-w-[260px] flex-col bg-[#1a1d23] text-gray-300">
        {/* Workspace Switcher */}
        <div className="flex items-center px-3 pt-3 pb-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-white/5">
                <div
                  className="flex h-6 w-6 items-center justify-center rounded text-[11px] font-bold text-white"
                  style={{
                    backgroundColor: currentWorkspace?.color ?? "#7C3AED",
                  }}
                >
                  {currentWorkspace?.name?.[0]?.toUpperCase() ?? "W"}
                </div>
                <span className="flex-1 truncate text-left">
                  {isLoading ? "Loading..." : currentWorkspace?.name ?? "Select workspace"}
                </span>
                <ChevronsUpDown className="h-4 w-4 shrink-0 text-gray-500" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
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
                Create workspace
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Separator className="bg-white/10" />

        {/* Quick Actions */}
        <div className="space-y-0.5 px-3 pt-3 pb-2">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-white/5 hover:text-white"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </button>
          <button
            onClick={() => {
              const event = new KeyboardEvent("keydown", {
                key: "k",
                metaKey: true,
              });
              document.dispatchEvent(event);
            }}
            className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-white/5 hover:text-white"
          >
            <Search className="h-4 w-4" />
            <span className="flex-1 text-left">Search</span>
            <kbd className="pointer-events-none rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-gray-500">
              ⌘K
            </kbd>
          </button>
          <button
            onClick={() => router.push("/notifications")}
            className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-white/5 hover:text-white"
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
            onClick={() => router.push("/dashboard/calendar-settings")}
            className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-white/5 hover:text-white"
          >
            <CalendarSync className="h-4 w-4" />
            Calendar Sync
          </button>
        </div>

        <Separator className="bg-white/10" />

        {/* Spaces Header */}
        <div className="flex items-center justify-between px-5 pt-3 pb-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            Spaces
          </span>
          <button
            onClick={() => setCreateSpaceOpen(true)}
            className="rounded p-0.5 text-gray-500 transition-colors hover:bg-white/10 hover:text-white"
            title="Add space"
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
                    className="h-7 animate-pulse rounded bg-white/5"
                  />
                ))}
              </div>
            ) : spaces.length === 0 ? (
              <div className="px-3 py-4 text-center">
                <p className="text-xs text-gray-500">No spaces yet</p>
                <button
                  onClick={() => setCreateSpaceOpen(true)}
                  className="mt-1 text-xs text-primary hover:underline"
                >
                  Create your first space
                </button>
              </div>
            ) : (
              <SidebarNav spaces={spaces} workspaceId={currentWorkspace!.id} mutateSpaces={mutateSpaces} />
            )}
          </div>
        </ScrollArea>

        <Separator className="bg-white/10" />

        {/* User Section */}
        <div className="p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-white/5">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={user?.image ?? undefined} />
                  <AvatarFallback className="bg-primary/20 text-[11px] text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="truncate text-sm font-medium text-white">
                    {user?.name ?? "User"}
                  </p>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
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
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-red-400 focus:text-red-400"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
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
