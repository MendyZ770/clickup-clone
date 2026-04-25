"use client";

import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { TaskDetailContent } from "./task-detail-content";

interface TaskDetailModalProps {
  taskId: string;
  workspaceId: string;
  onClose: () => void;
}

export function TaskDetailModal({
  taskId,
  workspaceId,
  onClose,
}: TaskDetailModalProps) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[80vw] h-[90vh] p-0 gap-0 overflow-hidden">
        <div className="flex items-center justify-between border-b px-4 py-2">
          <span className="text-xs text-muted-foreground font-mono">
            {taskId.slice(0, 8)}
          </span>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <TaskDetailContent taskId={taskId} workspaceId={workspaceId} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
