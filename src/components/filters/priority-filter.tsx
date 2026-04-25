"use client";

import { useState } from "react";
import { Check, Flag, ArrowUp, Minus, ArrowDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { PRIORITY_LEVELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const ICONS: Record<string, typeof Flag> = {
  urgent: Flag,
  high: ArrowUp,
  normal: Minus,
  low: ArrowDown,
};

const COLORS: Record<string, string> = {
  urgent: "text-red-500",
  high: "text-orange-500",
  normal: "text-blue-500",
  low: "text-gray-400",
};

interface PriorityFilterProps {
  selected: string[];
  onChange: (priorities: string[]) => void;
}

export function PriorityFilter({ selected, onChange }: PriorityFilterProps) {
  const [open, setOpen] = useState(false);

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((s) => s !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
          Priority
          {selected.length > 0 && (
            <span className="ml-0.5 rounded-full bg-primary/10 px-1.5 text-primary">
              {selected.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-40 p-1" align="start">
        {PRIORITY_LEVELS.map((p) => {
          const Icon = ICONS[p.value];
          return (
            <button
              key={p.value}
              onClick={() => toggle(p.value)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
            >
              <Icon className={cn("h-3.5 w-3.5", COLORS[p.value])} />
              <span className="flex-1 text-left">{p.label}</span>
              {selected.includes(p.value) && (
                <Check className="h-3.5 w-3.5 text-primary" />
              )}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
