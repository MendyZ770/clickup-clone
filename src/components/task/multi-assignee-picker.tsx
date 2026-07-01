"use client";

import { useState } from "react";
import useSWR from "swr";
import { User as UserIcon, Check } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Failed to fetch");
    return r.json();
  });

interface Member {
  id: string;
  user: { id: string; name: string | null; email: string; image: string | null };
}

interface MultiAssigneePickerProps {
  assigneeIds: string[];
  workspaceId: string;
  onChange?: (userIds: string[]) => void;
  size?: "sm" | "md";
  className?: string;
}

export function MultiAssigneePicker({
  assigneeIds,
  workspaceId,
  onChange,
  size = "sm",
  className,
}: MultiAssigneePickerProps) {
  const [open, setOpen] = useState(false);
  const { data: members } = useSWR<Member[]>(
    open || assigneeIds.length > 0 ? `/api/workspaces/${workspaceId}/members` : null,
    fetcher
  );

  const avatarSize = size === "sm" ? "h-7 w-7" : "h-9 w-9";
  const textSize = size === "sm" ? "text-sm" : "text-base";

  const selectedMembers = members?.filter(m => assigneeIds.includes(m.user.id)) || [];

  const trigger = (
    <div
      className={cn(
        "inline-flex items-center gap-1 transition-colors",
        onChange && "hover:bg-muted/50 cursor-pointer p-0.5 rounded-md",
        className
      )}
    >
      {selectedMembers.length > 0 ? (
        <div className="flex -space-x-2">
          {selectedMembers.slice(0, 3).map((m) => (
            <Avatar key={m.user.id} className={cn(avatarSize, "border-2 border-background")}>
              <AvatarImage src={m.user.image ?? undefined} />
              <AvatarFallback className="text-[10px]">
                {(m.user.name ?? m.user.email).slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ))}
          {selectedMembers.length > 3 && (
            <div className={cn(avatarSize, "rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] font-medium")}>
              +{selectedMembers.length - 3}
            </div>
          )}
        </div>
      ) : (
        <div
          className={cn(
            avatarSize,
            "rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center"
          )}
        >
          <UserIcon className="h-4 w-4 text-muted-foreground/50" />
        </div>
      )}
    </div>
  );

  if (!onChange) return trigger;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-56 p-1" align="start">
        <div className="space-y-0.5 max-h-60 overflow-y-auto custom-scrollbar">
          {(members ?? []).map((m) => {
            const isSelected = assigneeIds.includes(m.user.id);
            return (
              <button
                key={m.user.id}
                onClick={() => {
                  if (isSelected) {
                    onChange(assigneeIds.filter(id => id !== m.user.id));
                  } else {
                    onChange([...assigneeIds, m.user.id]);
                  }
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted",
                  isSelected && "bg-primary/5"
                )}
              >
                <div className="flex items-center gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={m.user.image ?? undefined} />
                    <AvatarFallback className="text-xs">
                      {(m.user.name ?? m.user.email).slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className={cn("truncate", textSize)}>
                    {m.user.name ?? m.user.email}
                  </span>
                </div>
                {isSelected && <Check className="h-4 w-4 text-primary" />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
