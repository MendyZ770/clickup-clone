"use client";

import { Droppable, Draggable } from "@hello-pangea/dnd";
import { TaskCard } from "@/components/task/task-card";
import { TaskForm } from "@/components/task/task-form";
import { cn } from "@/lib/utils";
import type { TaskSummary } from "@/types";

interface BoardColumnProps {
  status: { id: string; name: string; color: string };
  tasks: TaskSummary[];
  listId: string;
  onTaskCreated?: () => void;
  onTaskAction?: () => void;
}

export function BoardColumn({
  status,
  tasks,
  listId,
  onTaskCreated,
  onTaskAction,
}: BoardColumnProps) {
  return (
    <div className="flex h-full w-64 md:w-72 shrink-0 flex-col rounded-lg bg-muted/30">
      {/* Column header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b">
        <span
          className="h-2.5 w-2.5 rounded-sm shrink-0"
          style={{ backgroundColor: status.color }}
        />
        <span className="text-sm font-semibold truncate">{status.name}</span>
        <span className="text-xs text-muted-foreground ml-auto">
          {tasks.length}
        </span>
      </div>

      {/* Droppable area */}
      <Droppable droppableId={status.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex-1 overflow-y-auto p-2 space-y-2 min-h-[100px] transition-colors",
              snapshot.isDraggingOver && "bg-primary/5"
            )}
          >
            {tasks.map((task, index) => (
              <Draggable key={task.id} draggableId={task.id} index={index}>
                {(dragProvided, dragSnapshot) => (
                  <div
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                    {...dragProvided.dragHandleProps}
                    className={cn(
                      dragSnapshot.isDragging && "opacity-80 rotate-2"
                    )}
                  >
                    <TaskCard task={task} onAction={onTaskAction} />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* Add task */}
      <div className="p-2 border-t">
        <TaskForm
          listId={listId}
          statusId={status.id}
          onCreated={onTaskCreated}
        />
      </div>
    </div>
  );
}
