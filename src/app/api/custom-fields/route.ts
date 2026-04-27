import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId is required" },
        { status: 400 }
      );
    }

    // Verify user is a member of the workspace
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId: user.id },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 });
    }

    const fields = await prisma.customField.findMany({
      where: { workspaceId },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(fields);
  } catch (error) {
    console.error("GET /api/custom-fields error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, type, options, required, workspaceId, defaultValue } = body;

    if (!name || !type || !workspaceId) {
      return NextResponse.json(
        { error: "name, type, and workspaceId are required" },
        { status: 400 }
      );
    }

    const validTypes = [
      "text",
      "number",
      "dropdown",
      "checkbox",
      "date",
      "url",
      "email",
      "phone",
      "currency",
      "rating",
    ];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // Verify user is a member of the workspace
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId: user.id },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 });
    }

    // Get the next order value
    const lastField = await prisma.customField.findFirst({
      where: { workspaceId },
      orderBy: { order: "desc" },
    });

    const field = await prisma.customField.create({
      data: {
        name,
        type,
        options: options ? JSON.stringify(options) : null,
        required: required ?? false,
        defaultValue: defaultValue ?? null,
        order: (lastField?.order ?? -1) + 1,
        workspaceId,
      },
    });

    return NextResponse.json(field, { status: 201 });
  } catch (error) {
    console.error("POST /api/custom-fields error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
