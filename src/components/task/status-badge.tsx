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

const fetcher = (url: string) => fetch(url).then((r) => r.json());

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
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        onChange && "cursor-pointer hover:opacity-80",
        className
      )}
    >
      <span
        className="h-2 w-2 rounded-full shrink-0"
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
                className="h-2.5 w-2.5 rounded-full shrink-0"
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
