"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbSegment {
  label: string;
  href: string;
}

function getSegmentsFromPath(pathname: string): BreadcrumbSegment[] {
  const segments: BreadcrumbSegment[] = [];
  const parts = pathname.split("/").filter(Boolean);

  // Map known route segments to friendly names
  const routeLabels: Record<string, string> = {
    dashboard: "Tableau de bord",
    notifications: "Notifications",
    settings: "Paramètres",
    spaces: "Espaces",
    folders: "Dossiers",
    lists: "Listes",
    tasks: "Tâches",
  };

  let currentPath = "";
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    currentPath += `/${part}`;

    const label = routeLabels[part];
    if (label) {
      segments.push({ label, href: currentPath });
    } else if (i > 0) {
      // This is likely an ID - show it abbreviated or skip
      // We'll keep it but with a truncated display
      const prevPart = parts[i - 1];
      if (prevPart && routeLabels[prevPart]) {
        segments[segments.length - 1] = {
          ...segments[segments.length - 1],
          href: currentPath,
        };
      }
    }
  }

  return segments;
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = getSegmentsFromPath(pathname ?? "");

  if (segments.length === 0) {
    return (
      <div className="flex items-center text-sm text-muted-foreground">
        <Home className="h-4 w-4" />
      </div>
    );
  }

  return (
    <nav className="flex items-center gap-1 text-xs md:text-sm min-w-0 overflow-hidden">
      <Link
        href="/dashboard"
        className="text-muted-foreground transition-colors hover:text-foreground"
      >
        <Home className="h-4 w-4" />
      </Link>
      {segments.map((segment, index) => (
        <div key={segment.href} className="flex items-center gap-1">
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
          {index === segments.length - 1 ? (
            <span className="font-medium text-foreground truncate max-w-[120px] md:max-w-none">
              {segment.label}
            </span>
          ) : (
            <Link
              href={segment.href}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {segment.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
