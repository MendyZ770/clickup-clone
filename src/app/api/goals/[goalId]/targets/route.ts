import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { isWorkspaceMember } from "@/lib/auth-helpers";
import { parseMoney, serializeMoney } from "@/lib/money";

async function assertGoalUnlocked(goalId: string, userId: string) {
  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
    select: { locked: true, workspaceId: true },
  });
  if (!goal) return { ok: false as const, status: 404, error: "Goal not found" };
  if (!(await isWorkspaceMember(goal.workspaceId, userId))) {
    return { ok: false as const, status: 403, error: "Forbidden" };
  }
  if (goal.locked) {
    return {
      ok: false as const,
      status: 403,
      error: "Cet objectif est verrouillé. Déverrouillez-le avant de modifier ses cibles.",
    };
  }
  return { ok: true as const, workspaceId: goal.workspaceId };
}

export async function POST(req: Request, { params }: { params: Promise<{ goalId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { goalId } = await params;

    const check = await assertGoalUnlocked(goalId, user.id);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

    const { name, type, targetValue, unit, listId } = await req.json();
    if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

    const normalizedTarget = parseMoney(targetValue ?? 100);
    if (!normalizedTarget) {
      return NextResponse.json(
        { error: "targetValue doit être un nombre strictement positif" },
        { status: 400 }
      );
    }

    if (listId) {
      const list = await prisma.list.findFirst({
        where: { id: listId, space: { workspaceId: check.workspaceId } },
        select: { id: true },
      });
      if (!list) {
        return NextResponse.json(
          { error: "Liste introuvable dans ce workspace" },
          { status: 400 }
        );
      }
    }

    const target = await prisma.goalTarget.create({
      data: { name, type: type ?? "number", targetValue: normalizedTarget, unit, goalId, listId },
    });
    return NextResponse.json(serializeMoney(target), { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ goalId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { goalId } = await params;

    const check = await assertGoalUnlocked(goalId, user.id);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

    const { id, currentValue } = await req.json();
    if (!id || currentValue === undefined) return NextResponse.json({ error: "id and currentValue required" }, { status: 400 });

    const parsedCurrent = parseMoney(currentValue, { allowZero: true });
    if (!parsedCurrent) {
      return NextResponse.json(
        { error: "currentValue doit être un nombre positif" },
        { status: 400 }
      );
    }

    const updated = await prisma.goalTarget.updateMany({
      where: { id, goalId },
      data: { currentValue: parsedCurrent },
    });
    if (updated.count === 0) return NextResponse.json({ error: "Target not found" }, { status: 404 });
    const target = await prisma.goalTarget.findUnique({ where: { id } });
    return NextResponse.json(serializeMoney(target));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ goalId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { goalId } = await params;

    const check = await assertGoalUnlocked(goalId, user.id);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const deleted = await prisma.goalTarget.deleteMany({ where: { id, goalId } });
    if (deleted.count === 0) return NextResponse.json({ error: "Target not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
