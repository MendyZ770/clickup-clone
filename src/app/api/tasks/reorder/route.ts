import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { z } from "zod";

const reorderSchema = z.object({
  tasks: z.array(
    z.object({
      id: z.string().min(1),
      position: z.number(),
      statusId: z.string().optional(),
    })
  ),
});

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = reorderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { tasks } = parsed.data;

    const requestedIds = [...new Set(tasks.map((t) => t.id))];
    const accessibleTasks = await prisma.task.findMany({
      where: {
        id: { in: requestedIds },
        list: { space: { workspace: { members: { some: { userId: user.id } } } } },
      },
      select: { id: true, listId: true },
    });

    if (accessibleTasks.length !== requestedIds.length) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const listIdByTaskId = new Map(accessibleTasks.map((t) => [t.id, t.listId]));
    const listIds = [...new Set(accessibleTasks.map((t) => t.listId))];
    const statuses = await prisma.status.findMany({
      where: { listId: { in: listIds } },
      select: { id: true, listId: true },
    });
    const listIdByStatusId = new Map(
      statuses.map((s) => [s.id, s.listId])
    );

    for (const t of tasks) {
      if (t.statusId && !t.statusId.startsWith("global:")) {
        if (listIdByStatusId.get(t.statusId) !== listIdByTaskId.get(t.id)) {
          return NextResponse.json(
            { error: "Statut invalide pour cette liste" },
            { status: 400 }
          );
        }
      }
    }

    // Bulk update using a transaction
    await prisma.$transaction(
      async (tx) => {
        for (const t of tasks) {
          const data: { position: number; statusId?: string } = {
            position: t.position,
          };

          if (t.statusId) {
            if (t.statusId.startsWith("global:")) {
              const statusName = t.statusId.replace("global:", "");
              const listId = listIdByTaskId.get(t.id);

              if (listId) {
                // Find status by name in this list
                let targetStatus = await tx.status.findFirst({
                  where: { listId, name: { equals: statusName, mode: "insensitive" } },
                });

                // If not found, auto-create it
                if (!targetStatus) {
                  // get last order
                  const last = await tx.status.findFirst({
                    where: { listId },
                    orderBy: { order: "desc" }
                  });
                  targetStatus = await tx.status.create({
                    data: {
                      name: statusName,
                      color: "#6B7280",
                      type: "custom",
                      order: last ? last.order + 1 : 0,
                      listId,
                    }
                  });
                }

                data.statusId = targetStatus.id;
              }
            } else {
              data.statusId = t.statusId;
            }
          }

          await tx.task.update({
            where: { id: t.id },
            data,
          });
        }
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/tasks/reorder error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
