"use client";

import { useRouter, usePathname } from "next/navigation";
import { List, LayoutGrid, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface ViewOption {
  id: string;
  label: string;
  icon: React.ElementType;
  segment: string;
}

const VIEW_OPTIONS: ViewOption[] = [
  { id: "list", label: "List", icon: List, segment: "list-view" },
  { id: "board", label: "Board", icon: LayoutGrid, segment: "board" },
  { id: "calendar", label: "Calendar", icon: Calendar, segment: "calendar" },
];

interface ViewSwitcherProps {
  basePath?: string;
}

export function ViewSwitcher({ basePath }: ViewSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Determine active view from the current pathname
  const currentSegment = pathname.split("/").pop() ?? "list-view";
  const currentView =
    VIEW_OPTIONS.find((o) => o.segment === currentSegment)?.id ?? "list";

  const handleViewChange = (view: ViewOption) => {
    if (basePath) {
      // basePath already contains the full path including current segment
      // We need the list base path (up to [listId])
      const listBasePath = basePath.replace(
        /\/(list-view|board|calendar)$/,
        ""
      );
      router.push(`${listBasePath}/${view.segment}`);
    } else {
      // Fallback: replace last segment of current pathname
      const segments = pathname.split("/");
      segments[segments.length - 1] = view.segment;
      router.push(segments.join("/"));
    }
  };

  return (
    <div className="flex items-center gap-0.5 rounded-lg border bg-muted/30 p-0.5">
      {VIEW_OPTIONS.map((option) => {
        const isActive = currentView === option.id;
        const Icon = option.icon;

        return (
          <button
            key={option.id}
            onClick={() => handleViewChange(option)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
