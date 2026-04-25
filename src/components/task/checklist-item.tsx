"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface ChecklistItemProps {
  item: {
    id: string;
    text: string;
    completed: boolean;
  };
  taskId: string;
  checklistId: string;
  onChanged?: () => void;
}

export function ChecklistItemRow({
  item,
  taskId,
  checklistId,
  onChanged,
}: ChecklistItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleToggle = async (checked: boolean) => {
    await fetch(
      `/api/tasks/${taskId}/checklists/${checklistId}/items`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, completed: checked }),
      }
    );
    onChanged?.();
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    await fetch(
      `/api/tasks/${taskId}/checklists/${checklistId}/items?itemId=${item.id}`,
      { method: "DELETE" }
    );
    onChanged?.();
  };

  return (
    <div className="group flex items-center gap-2 rounded px-2 py-1 hover:bg-muted/50 transition-colors">
      <Checkbox
        checked={item.completed}
        onCheckedChange={(checked) => handleToggle(!!checked)}
        className="h-3.5 w-3.5"
      />
      <span
        className={cn(
          "flex-1 text-sm",
          item.completed && "line-through text-muted-foreground"
        )}
      >
        {item.text}
      </span>
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="hidden group-hover:block text-muted-foreground hover:text-destructive transition-colors"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}
