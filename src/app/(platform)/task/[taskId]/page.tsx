import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { notFound } from "next/navigation";
import { TaskDetailPageClient } from "./task-detail-page-client";

interface TaskPageProps {
  params: Promise<{ taskId: string }>;
}

export default async function TaskPage({ params }: TaskPageProps) {
  const user = await requireAuth();
  const { taskId } = await params;

  // Verify the task exists and user has access
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      list: {
        include: {
          space: {
            include: {
              workspace: {
                include: {
                  members: { where: { userId: user.id } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!task || task.list.space.workspace.members.length === 0) {
    notFound();
  }

  const workspaceId = task.list.space.workspace.id;

  return <TaskDetailPageClient taskId={taskId} workspaceId={workspaceId} />;
}
