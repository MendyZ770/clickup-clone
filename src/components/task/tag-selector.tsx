"use client";

import { useState } from "react";
import useSWR from "swr";
import { Plus, X, Tag as TagIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Failed to fetch");
    return r.json();
  });

interface TagData {
  id: string;
  name: string;
  color: string;
}

interface TaskTagWithTag {
  tag: TagData;
}

interface TagSelectorProps {
  taskTags: TaskTagWithTag[];
  taskId: string;
  workspaceId: string;
  onTagAdded?: () => void;
  onTagRemoved?: () => void;
  className?: string;
}

export function TagSelector({
  taskTags,
  taskId,
  workspaceId,
  onTagAdded,
  onTagRemoved,
  className,
}: TagSelectorProps) {
  const [open, setOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const { data: allTags, mutate: mutateTags } = useSWR<TagData[]>(
    open ? `/api/tags?workspaceId=${workspaceId}` : null,
    fetcher
  );

  const attachedTagIds = new Set(taskTags.map((tt) => tt.tag.id));

  const handleAddTag = async (tagId: string) => {
    await fetch(`/api/tasks/${taskId}/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tagId }),
    });
    onTagAdded?.();
  };

  const handleRemoveTag = async (tagId: string) => {
    await fetch(`/api/tasks/${taskId}/tags?tagId=${tagId}`, {
      method: "DELETE",
    });
    onTagRemoved?.();
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    setIsCreating(true);
    try {
      const colors = [
        "#EF4444",
        "#F97316",
        "#EAB308",
        "#22C55E",
        "#3B82F6",
        "#8B5CF6",
        "#EC4899",
      ];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTagName.trim(),
          color,
          workspaceId,
        }),
      });
      if (res.ok) {
        const tag = await res.json();
        await handleAddTag(tag.id);
        mutateTags();
        setNewTagName("");
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      {taskTags.map((tt) => (
        <span
          key={tt.tag.id}
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
          style={{ backgroundColor: tt.tag.color }}
        >
          {tt.tag.name}
          {onTagRemoved && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveTag(tt.tag.id);
              }}
              className="hover:bg-white/20 rounded-full"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          )}
        </span>
      ))}
      {onTagAdded && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button className="inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] text-muted-foreground hover:bg-muted transition-colors">
              <Plus className="h-3 w-3" />
              <TagIcon className="h-3 w-3" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2" align="start">
            <div className="space-y-2">
              <div className="flex gap-1">
                <Input
                  placeholder="Nouveau tag..."
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  className="h-7 text-xs"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleCreateTag();
                    }
                  }}
                />
                <Button
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={handleCreateTag}
                  disabled={!newTagName.trim() || isCreating}
                >
                  Ajouter
                </Button>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-0.5">
                {(allTags ?? []).map((tag) => {
                  const isAttached = attachedTagIds.has(tag.id);
                  return (
                    <button
                      key={tag.id}
                      onClick={() => {
                        if (isAttached) {
                          handleRemoveTag(tag.id);
                        } else {
                          handleAddTag(tag.id);
                        }
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 rounded px-2 py-1 text-xs hover:bg-muted",
                        isAttached && "bg-muted"
                      )}
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="truncate">{tag.name}</span>
                      {isAttached && (
                        <X className="h-3 w-3 ml-auto text-muted-foreground" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
