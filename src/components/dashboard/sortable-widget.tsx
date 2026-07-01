"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SortableWidgetProps {
  id: string;
  title: string;
  type: string;
  isEditing: boolean;
  onDelete: () => void;
  children: React.ReactNode;
}

export function SortableWidget({
  id,
  title,
  type,
  isEditing,
  onDelete,
  children,
}: SortableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !isEditing });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`h-full ${isDragging ? "shadow-2xl ring-2 ring-primary relative z-50 rounded-xl" : "relative group"}`}
    >
      {isEditing && (
        <div className="absolute top-2 right-2 z-50 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm p-1 rounded-md border shadow-sm">
          <div
            className="cursor-move p-1.5 hover:bg-muted rounded-md touch-none"
            {...attributes}
            {...listeners}
          >
            <GripHorizontal className="h-4 w-4 text-muted-foreground" />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}
      <div className={cn(
        "h-full w-full transition-all",
        isEditing ? "pointer-events-none" : "",
        "[&>div]:h-full [&>div]:overflow-y-auto"
      )}>
        {children}
      </div>
    </div>
  );
}
