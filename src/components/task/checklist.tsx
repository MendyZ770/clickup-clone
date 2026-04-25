"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Plus, ListChecks } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChecklistItemRow } from "./checklist-item";
import type { ChecklistWithItems } from "@/types";

interface ChecklistProps {
  checklist: ChecklistWithItems;
  taskId: string;
  onChanged?: () => void;
}

export function Checklist({ checklist, taskId, onChanged }: ChecklistProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [newText, setNewText] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const doneCount = checklist.items.filter((i) => i.completed).length;
  const totalCount = checklist.items.length;
  const progress = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;

  const handleAddItem = async () => {
    const trimmed = newText.trim();
    if (!trimmed || isCreating) return;
    setIsCreating(true);
    try {
      await fetch(
        `/api/tasks/${taskId}/checklists/${checklist.id}/items`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: trimmed }),
        }
      );
      setNewText("");
      onChanged?.();
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-2 rounded-lg border p-3">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-1.5 text-sm font-semibold hover:text-primary transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
          <ListChecks className="h-4 w-4" />
          {checklist.title}
        </button>
        <span className="text-xs text-muted-foreground">
          {doneCount}/{totalCount}
        </span>
      </div>

      {!collapsed && (
        <>
          <Progress value={progress} className="h-1.5" />

          <div className="space-y-0.5">
            {checklist.items.map((item) => (
              <ChecklistItemRow
                key={item.id}
                item={item}
                taskId={taskId}
                checklistId={checklist.id}
                onChanged={onChanged}
              />
            ))}
          </div>

          <div className="flex gap-1 px-2">
            <Input
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Add an item..."
              className="h-7 text-xs"
              disabled={isCreating}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddItem();
                }
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}

interface ChecklistSectionProps {
  checklists: ChecklistWithItems[];
  taskId: string;
  onChanged?: () => void;
}

export function ChecklistSection({
  checklists,
  taskId,
  onChanged,
}: ChecklistSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateChecklist = async () => {
    const trimmed = newTitle.trim();
    if (!trimmed || isCreating) return;
    setIsCreating(true);
    try {
      await fetch(`/api/tasks/${taskId}/checklists`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed }),
      });
      setNewTitle("");
      setIsAdding(false);
      onChanged?.();
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Checklists</h3>
        {!isAdding && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="h-3 w-3" />
            Add Checklist
          </Button>
        )}
      </div>

      {isAdding && (
        <div className="flex gap-2">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Checklist title..."
            className="h-8 text-sm"
            autoFocus
            disabled={isCreating}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleCreateChecklist();
              }
              if (e.key === "Escape") {
                setIsAdding(false);
                setNewTitle("");
              }
            }}
          />
          <Button
            size="sm"
            className="h-8"
            onClick={handleCreateChecklist}
            disabled={!newTitle.trim() || isCreating}
          >
            Add
          </Button>
        </div>
      )}

      {checklists.map((cl) => (
        <Checklist
          key={cl.id}
          checklist={cl}
          taskId={taskId}
          onChanged={onChanged}
        />
      ))}
    </div>
  );
}
