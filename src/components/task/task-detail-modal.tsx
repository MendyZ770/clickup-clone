"use client";

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
      <DialogContent className="!w-screen !max-w-none h-[100dvh] md:!w-[90vw] md:!max-w-6xl md:h-[90vh] !p-0 !gap-0 overflow-hidden !rounded-none md:!rounded-xl flex flex-col bg-background/80 backdrop-blur-xl border-border/40 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border/30 px-4 py-3 shrink-0 pt-[max(0.75rem,env(safe-area-inset-top))] bg-background/40">
          <span className="text-xs text-muted-foreground font-mono">
            #{taskId.slice(0, 8)}
          </span>
        </div>
        <div className="flex-1 overflow-hidden">
          <TaskDetailContent taskId={taskId} workspaceId={workspaceId} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
