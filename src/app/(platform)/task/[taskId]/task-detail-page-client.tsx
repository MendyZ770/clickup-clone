"use client";

import { TaskDetailContent } from "@/components/task/task-detail-content";

interface TaskDetailPageClientProps {
  taskId: string;
  workspaceId: string;
}

export function TaskDetailPageClient({
  taskId,
  workspaceId,
}: TaskDetailPageClientProps) {
  return (
    <div className="h-full">
      <TaskDetailContent taskId={taskId} workspaceId={workspaceId} />
    </div>
  );
}
