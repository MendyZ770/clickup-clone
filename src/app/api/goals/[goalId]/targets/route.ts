import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

async function assertGoalUnlocked(goalId: string) {
  const goal = await prisma.goal.findUnique({ where: { id: goalId }, select: { locked: true } });
  if (!goal) return { ok: false as const, status: 404, error: "Goal not found" };
  if (goal.locked) {
    return {
      ok: false as const,
      status: 403,
      error: "Cet objectif est verrouillé. Déverrouillez-le avant de modifier ses cibles.",
    };
  }
  return { ok: true as const };
}

export async function POST(req: Request, { params }: { params: Promise<{ goalId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { goalId } = await params;

    const check = await assertGoalUnlocked(goalId);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

    const { name, type, targetValue, unit, listId } = await req.json();
    if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

    const target = await prisma.goalTarget.create({
      data: { name, type: type ?? "number", targetValue: targetValue ?? 100, unit, goalId, listId },
    });
    return NextResponse.json(target, { status: 201 });
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

    const check = await assertGoalUnlocked(goalId);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

    const { id, currentValue } = await req.json();
    if (!id || currentValue === undefined) return NextResponse.json({ error: "id and currentValue required" }, { status: 400 });

    const target = await prisma.goalTarget.update({
      where: { id },
      data: { currentValue },
    });
    return NextResponse.json(target);
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

    const check = await assertGoalUnlocked(goalId);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await prisma.goalTarget.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
