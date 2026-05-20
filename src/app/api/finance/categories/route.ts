/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");
    const type = searchParams.get("type");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    const where: any = { workspaceId };
    if (type) where.type = type;

    const categories = await (prisma as any).financeCategory.findMany({
      where,
      orderBy: { name: "asc" },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("[FINANCE_CATEGORIES_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { name, type, color, icon, workspaceId } = body;

    if (!name || !type || !workspaceId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const category = await (prisma as any).financeCategory.create({
      data: {
        name,
        type,
        color: color || "#6B7280",
        icon: icon || "tag",
        workspaceId,
      },
    });

    return NextResponse.json(category);
  } catch (error: any) {
    console.error("[FINANCE_CATEGORIES_POST]", error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Category already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
