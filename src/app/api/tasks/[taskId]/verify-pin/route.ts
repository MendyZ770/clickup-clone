import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

interface RouteContext {
  params: Promise<{ taskId: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId } = await context.params;
    const body = await request.json();
    const pin: string | undefined = body.pin;

    if (typeof pin !== "string" || !/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { error: "Code invalide (4 chiffres requis)" },
        { status: 400 }
      );
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        lockedPin: true,
        locked: true,
        list: {
          include: {
            space: {
              include: {
                workspace: {
                  include: { members: { where: { userId: user.id } } },
                },
              },
            },
          },
        },
      },
    });

    if (!task || task.list.space.workspace.members.length === 0) {
      return NextResponse.json({ error: "Tâche introuvable" }, { status: 404 });
    }

    if (!task.locked || !task.lockedPin) {
      return NextResponse.json({ valid: true });
    }

    if (task.lockedPin !== pin) {
      return NextResponse.json(
        { valid: false, error: "Code incorrect" },
        { status: 401 }
      );
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error("POST verify-pin error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
