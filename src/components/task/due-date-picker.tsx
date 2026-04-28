"use client";

import { useState } from "react";
import { format, isToday, isPast, isTomorrow } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DueDatePickerProps {
  date: string | Date | null;
  onChange?: (date: string | null) => void;
  className?: string;
}

export function DueDatePicker({
  date,
  onChange,
  className,
}: DueDatePickerProps) {
  const [open, setOpen] = useState(false);

  const dateObj = date ? new Date(date) : null;
  const isOverdue = dateObj ? isPast(dateObj) && !isToday(dateObj) : false;
  const isDueToday = dateObj ? isToday(dateObj) : false;
  const isDueTomorrow = dateObj ? isTomorrow(dateObj) : false;

  const getDateColor = () => {
    if (isOverdue) return "text-red-500";
    if (isDueToday) return "text-orange-500";
    if (isDueTomorrow) return "text-yellow-600";
    return "text-muted-foreground";
  };

  const getDateLabel = () => {
    if (!dateObj) return "Sans échéance";
    if (isOverdue) return `En retard : ${format(dateObj, "d MMM")}`;
    if (isDueToday) return "Aujourd'hui";
    if (isDueTomorrow) return "Demain";
    return format(dateObj, "d MMM yyyy");
  };

  const trigger = (
    <button
      className={cn(
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium transition-colors",
        getDateColor(),
        onChange && "hover:bg-muted cursor-pointer",
        className
      )}
    >
      <CalendarIcon className="h-3 w-3" />
      <span>{getDateLabel()}</span>
    </button>
  );

  if (!onChange) return trigger;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={dateObj ?? undefined}
          onSelect={(day) => {
            onChange(day ? day.toISOString() : null);
            setOpen(false);
          }}
          initialFocus
        />
        {dateObj && (
          <div className="border-t px-3 py-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full gap-1 text-muted-foreground"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
            >
              <X className="h-3 w-3" />
              {"Supprimer l'échéance"}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
