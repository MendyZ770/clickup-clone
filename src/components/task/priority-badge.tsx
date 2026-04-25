"use client";

import { useState } from "react";
import {
  Flag,
  ArrowUp,
  Minus,
  ArrowDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { PRIORITY_LEVELS } from "@/lib/constants";

const PRIORITY_CONFIG: Record<
  string,
  { icon: typeof Flag; color: string; label: string }
> = {
  urgent: { icon: Flag, color: "text-red-500", label: "Urgent" },
  high: { icon: ArrowUp, color: "text-orange-500", label: "High" },
  normal: { icon: Minus, color: "text-blue-500", label: "Normal" },
  low: { icon: ArrowDown, color: "text-gray-400", label: "Low" },
};

interface PriorityBadgeProps {
  priority: string;
  onChange?: (priority: string) => void;
  showLabel?: boolean;
  className?: string;
}

export function PriorityBadge({
  priority,
  onChange,
  showLabel = false,
  className,
}: PriorityBadgeProps) {
  const [open, setOpen] = useState(false);
  const config = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.normal;
  const Icon = config.icon;

  const badge = (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium",
        onChange && "cursor-pointer hover:bg-muted",
        className
      )}
    >
      <Icon className={cn("h-3.5 w-3.5", config.color)} />
      {showLabel && <span className={config.color}>{config.label}</span>}
    </div>
  );

  if (!onChange) return badge;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>{badge}</DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-36">
        {PRIORITY_LEVELS.map((p) => {
          const pConfig = PRIORITY_CONFIG[p.value];
          const PIcon = pConfig.icon;
          return (
            <DropdownMenuItem
              key={p.value}
              onClick={() => {
                onChange(p.value);
                setOpen(false);
              }}
              className="gap-2"
            >
              <PIcon className={cn("h-3.5 w-3.5", pConfig.color)} />
              <span>{p.label}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
