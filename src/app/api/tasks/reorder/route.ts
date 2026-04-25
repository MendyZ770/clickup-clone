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
      tasks.map((t) => {
        const data: { position: number; statusId?: string } = {
          position: t.position,
        };
        if (t.statusId) {
          data.statusId = t.statusId;
        }
        return prisma.task.update({
          where: { id: t.id },
          data,
        });
      })
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
