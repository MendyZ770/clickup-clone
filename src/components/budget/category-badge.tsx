"use client";

import { Tag } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryBadgeProps {
  name: string;
  color?: string;
  icon?: string;
  className?: string;
}

export function CategoryBadge({ name, color = "#6B7280", className }: CategoryBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        className
      )}
      style={{
        backgroundColor: `${color}20`,
        color,
      }}
    >
      <Tag className="h-3 w-3" />
      {name}
    </span>
  );
}
