import { prisma } from "./prisma";

/**
 * Verifies if a user has access to a specific task.
 * The user must be a member of the workspace where the task belongs.
 */
export async function verifyTaskAccess(taskId: string, userId: string): Promise<boolean> {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      list: {
        space: {
          workspace: {
            members: {
              some: {
                userId,
              },
            },
          },
        },
      },
    },
    select: { id: true },
  });

  return !!task;
}
