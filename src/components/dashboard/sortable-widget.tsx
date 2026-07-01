"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { WidgetCard } from "./widget-card";

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
      className={`h-full ${isDragging ? "shadow-2xl ring-2 ring-primary relative z-50" : "relative"}`}
    >
      <WidgetCard
        title={title}
        isEditing={isEditing}
        onDelete={onDelete}
        dragHandleProps={isEditing ? { ...attributes, ...listeners } : undefined}
      >
        {children}
      </WidgetCard>
    </div>
  );
}
