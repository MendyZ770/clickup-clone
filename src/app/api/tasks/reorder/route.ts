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
              
              // We need the task's listId to find/create the status
              const task = await tx.task.findUnique({
                where: { id: t.id },
                select: { listId: true },
              });
              
              if (task) {
                // Find status by name in this list
                let targetStatus = await tx.status.findFirst({
                  where: { listId: task.listId, name: statusName },
                });
                
                // If not found, auto-create it
                if (!targetStatus) {
                  // get last order
                  const last = await tx.status.findFirst({
                    where: { listId: task.listId },
                    orderBy: { order: "desc" }
                  });
                  targetStatus = await tx.status.create({
                    data: {
                      name: statusName,
                      color: "#6B7280",
                      type: "custom",
                      order: last ? last.order + 1 : 0,
                      listId: task.listId,
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
