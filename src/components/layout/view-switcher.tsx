"use client";

import { useRouter, usePathname, useParams } from "next/navigation";
import { List, LayoutGrid, Calendar, GanttChart, Users, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface ViewOption {
  id: string;
  label: string;
  icon: React.ElementType;
  segment: string;
}

const VIEW_OPTIONS: ViewOption[] = [
  { id: "list", label: "Liste", icon: List, segment: "list-view" },
  { id: "board", label: "Tableau", icon: LayoutGrid, segment: "board" },
  { id: "calendar", label: "Calendrier", icon: Calendar, segment: "calendar" },
  { id: "gantt", label: "Gantt", icon: GanttChart, segment: "gantt" },
  { id: "workload", label: "Charge", icon: Users, segment: "workload" },
  { id: "chat", label: "Chat", icon: MessageSquare, segment: "chat" },
];

interface ViewSwitcherProps {
  basePath?: string;
}

export function ViewSwitcher({ basePath }: ViewSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams<{ workspaceId: string; spaceId: string }>();

  // Determine active view from the current pathname
  const currentSegment = pathname.split("/").pop() ?? "";
  const isWorkspaceRoot = currentSegment === params.workspaceId;
  const isSpaceRoot = currentSegment === params.spaceId;
  
  const currentView =
    VIEW_OPTIONS.find((o) => o.segment === currentSegment)?.id ?? 
    (isWorkspaceRoot || isSpaceRoot ? "overview" : "list");

  // We add Overview dynamically if we are at space/workspace level
  const options = (pathname.includes("/list/") && !pathname.match(/\/list\/[^\/]+$/)) 
    ? VIEW_OPTIONS 
    : [{ id: "overview", label: "Vue d'ensemble", icon: LayoutGrid, segment: "" }, ...VIEW_OPTIONS];

  const handleViewChange = (view: ViewOption) => {
    if (basePath) {
      // basePath should just be the base URL without view segment
      const cleanBasePath = basePath.replace(
        /\/(list-view|board|calendar|gantt|workload|chat)$/,
        ""
      );
      router.push(view.segment ? `${cleanBasePath}/${view.segment}` : cleanBasePath);
    } else {
      // Auto-detect base path
      const cleanPathname = pathname.replace(
        /\/(list-view|board|calendar|gantt|workload|chat)$/,
        ""
      );
      router.push(view.segment ? `${cleanPathname}/${view.segment}` : cleanPathname);
    }
  };

  return (
    <div className="flex items-center gap-0.5 rounded-lg border bg-muted/30 p-0.5">
      {options.map((option) => {
        const isActive = currentView === option.id;
        const Icon = option.icon;

        return (
          <button
            key={option.id}
            onClick={() => handleViewChange(option)}
            className={cn(
              "flex items-center gap-1 md:gap-1.5 rounded-md px-2 md:px-3 py-1.5 text-xs md:text-sm font-medium transition-all",
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
