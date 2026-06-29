"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Failed to fetch");
    return r.json();
  });

interface StatusBadgeProps {
  status: { id: string; name: string; color: string };
  listId?: string;
  onChange?: (statusId: string) => void;
  className?: string;
}

export function StatusBadge({
  status,
  listId,
  onChange,
  className,
}: StatusBadgeProps) {
  const [open, setOpen] = useState(false);
  const { data: statuses } = useSWR(
    listId && onChange && open ? `/api/lists/${listId}/statuses` : null,
    fetcher
  );

  const badge = (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider transition-all duration-200 border",
        onChange && "cursor-pointer hover:shadow-sm hover:brightness-110 active:scale-95",
        className
      )}
      style={{
        backgroundColor: `${status.color}1A`, // 10% opacity background
        borderColor: `${status.color}33`,     // 20% opacity border
        color: status.color,                  // text matches dot
      }}
    >
      <span
        className="h-2 w-2 rounded-full shrink-0 shadow-sm"
        style={{ backgroundColor: status.color }}
      />
      <span className="truncate">{status.name}</span>
    </div>
  );

  if (!onChange || !listId) return badge;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>{badge}</DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        {(statuses ?? []).map(
          (s: { id: string; name: string; color: string }) => (
            <DropdownMenuItem
              key={s.id}
              onClick={() => {
                onChange(s.id);
                setOpen(false);
              }}
              className="gap-2"
            >
              <span
                className="h-3 w-3 rounded-full shrink-0"
                style={{ backgroundColor: s.color }}
              />
              <span>{s.name}</span>
            </DropdownMenuItem>
          )
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
