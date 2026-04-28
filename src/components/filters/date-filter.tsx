"use client";

import { useState } from "react";
import { Check, CalendarDays } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

const DATE_OPTIONS = [
  { value: "overdue", label: "En retard" },
  { value: "today", label: "Aujourd'hui" },
  { value: "this_week", label: "Cette semaine" },
  { value: "next_week", label: "Semaine prochaine" },
  { value: "no_date", label: "Sans échéance" },
] as const;

interface DateFilterProps {
  selected: string | null;
  onChange: (value: string | null) => void;
}

export function DateFilter({ selected, onChange }: DateFilterProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
          <CalendarDays className="h-3 w-3" />
          Échéance
          {selected && (
            <span className="ml-0.5 rounded-full bg-primary/10 px-1.5 text-primary">
              1
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-44 p-1" align="start">
        {DATE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => {
              onChange(selected === opt.value ? null : opt.value);
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
          >
            <span className="flex-1 text-left">{opt.label}</span>
            {selected === opt.value && (
              <Check className="h-3.5 w-3.5 text-primary" />
            )}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
