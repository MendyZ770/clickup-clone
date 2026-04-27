"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  Plus,
  Trash2,
  GripVertical,
  Loader2,
  Lock,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
  "#D2D5DA",
  "#FFA500",
  "#A855F7",
  "#16A34A",
  "#6B7280",
  "#EF4444",
  "#3B82F6",
  "#F59E0B",
  "#EC4899",
  "#06B6D4",
  "#8B5CF6",
  "#14B8A6",
];

const DEFAULT_TYPES = ["todo", "in_progress", "review", "done", "closed"];

interface Status {
  id: string;
  name: string;
  color: string;
  type: string;
  order: number;
  listId: string;
}

interface StatusManagerProps {
  listId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged?: () => void;
}

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Failed to fetch");
    return r.json();
  });

export function StatusManager({
  listId,
  open,
  onOpenChange,
  onChanged,
}: StatusManagerProps) {
  const {
    data: statuses,
    isLoading,
    mutate,
  } = useSWR<Status[]>(
    open ? `/api/lists/${listId}/statuses` : null,
    fetcher
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#6B7280");
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleStartEdit = (status: Status) => {
    setEditingId(status.id);
    setEditName(status.name);
    setEditColor(status.color);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    setError("");

    try {
      const res = await fetch(`/api/lists/${listId}/statuses`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          name: editName.trim(),
          color: editColor,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update status");
      }

      setEditingId(null);
      mutate();
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  const handleAddStatus = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    setError("");

    try {
      const res = await fetch(`/api/lists/${listId}/statuses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), color: newColor }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add status");
      }

      setNewName("");
      setNewColor("#6B7280");
      mutate();
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteStatus = async (statusId: string) => {
    setDeletingId(statusId);
    setError("");

    try {
      const res = await fetch(
        `/api/lists/${listId}/statuses?statusId=${statusId}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete status");
      }

      mutate();
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Statuses</DialogTitle>
          <DialogDescription>
            Customize the statuses for this list. Default statuses cannot be
            deleted.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-500">
            {error}
          </div>
        )}

        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            statuses?.map((status) => {
              const isDefault = DEFAULT_TYPES.includes(status.type);
              const isEditing = editingId === status.id;

              return (
                <div
                  key={status.id}
                  className="flex items-center gap-2 rounded-lg border border-border/50 px-3 py-2"
                >
                  <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/40" />

                  {isEditing ? (
                    <>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            className="h-5 w-5 shrink-0 rounded-full border border-border"
                            style={{ backgroundColor: editColor }}
                          />
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-3" align="start">
                          <div className="grid grid-cols-6 gap-1.5">
                            {PRESET_COLORS.map((c) => (
                              <button
                                key={c}
                                onClick={() => setEditColor(c)}
                                className={cn(
                                  "h-6 w-6 rounded-full border-2 transition-transform hover:scale-110",
                                  editColor === c
                                    ? "border-white"
                                    : "border-transparent"
                                )}
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-7 flex-1 text-sm"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit();
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        autoFocus
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={handleSaveEdit}
                      >
                        <span className="text-xs text-green-500">Save</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setEditingId(null)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span
                        className="h-4 w-4 shrink-0 rounded-full"
                        style={{ backgroundColor: status.color }}
                      />
                      <button
                        onClick={() => handleStartEdit(status)}
                        className="flex-1 text-left text-sm hover:text-primary transition-colors"
                      >
                        {status.name}
                      </button>
                      {isDefault ? (
                        <Lock className="h-3.5 w-3.5 text-muted-foreground/50" />
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-red-500"
                          disabled={deletingId === status.id}
                          onClick={() => handleDeleteStatus(status.id)}
                        >
                          {deletingId === status.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      )}
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>

        <Separator />

        {/* Add new status */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            Add new status
          </Label>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className="h-8 w-8 shrink-0 rounded-full border border-border"
                  style={{ backgroundColor: newColor }}
                />
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3" align="start">
                <div className="grid grid-cols-6 gap-1.5">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setNewColor(c)}
                      className={cn(
                        "h-6 w-6 rounded-full border-2 transition-transform hover:scale-110",
                        newColor === c
                          ? "border-white"
                          : "border-transparent"
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New status name"
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddStatus();
              }}
            />
            <Button
              size="sm"
              onClick={handleAddStatus}
              disabled={adding || !newName.trim()}
            >
              {adding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
