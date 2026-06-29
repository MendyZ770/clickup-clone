 
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    const goals = await prisma.financeGoal.findMany({
      where: { workspaceId, userId: user.id },
      include: {
        _count: { select: { contributions: true } },
        account: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(goals);
  } catch (error) {
    console.error("[FINANCE_GOALS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { name, description, targetAmount, currentAmount, currency, color, deadline, workspaceId, accountId } = body;

    if (!name || !targetAmount || !workspaceId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const goal = await prisma.financeGoal.create({
      data: {
        name,
        description,
        targetAmount,
        currentAmount: currentAmount || 0,
        currency: currency || "EUR",
        color: color || "#10B981",
        deadline: deadline ? new Date(deadline) : undefined,
        workspaceId,
        userId: user.id,
        accountId,
      },
    });

    return NextResponse.json(goal);
  } catch (error) {
    console.error("[FINANCE_GOALS_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
