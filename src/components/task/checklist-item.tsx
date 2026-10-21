"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { apiJson, apiErrorMessage } from "@/lib/api-client";

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
    try {
      await apiJson(
        `/api/tasks/${taskId}/checklists/${checklistId}/items`,
        {
          method: "PATCH",
          body: JSON.stringify({ id: item.id, completed: checked }),
        }
      );
      onChanged?.();
    } catch (error) {
      toast({ title: "Enregistrement impossible", description: apiErrorMessage(error), variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await apiJson(
        `/api/tasks/${taskId}/checklists/${checklistId}/items?itemId=${item.id}`,
        { method: "DELETE" }
      );
      onChanged?.();
    } catch (error) {
      toast({ title: "Suppression impossible", description: apiErrorMessage(error), variant: "destructive" });
      setIsDeleting(false);
    }
  };

  return (
    <div className="group flex items-center gap-2 rounded px-2 py-1 hover:bg-muted/50 transition-colors">
      <Checkbox
        checked={item.completed}
        onCheckedChange={(checked) => handleToggle(!!checked)}
        className="h-4 w-4"
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
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
