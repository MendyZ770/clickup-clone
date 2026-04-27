import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

interface RouteContext {
  params: Promise<{ fieldId: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fieldId } = await context.params;

    // Verify field exists and user has access
    const field = await prisma.customField.findUnique({
      where: { id: fieldId },
      include: {
        workspace: {
          include: { members: { where: { userId: user.id } } },
        },
      },
    });

    if (!field || field.workspace.members.length === 0) {
      return NextResponse.json({ error: "Field not found" }, { status: 404 });
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.required !== undefined) updateData.required = body.required;
    if (body.options !== undefined) {
      updateData.options = body.options ? JSON.stringify(body.options) : null;
    }
    if (body.order !== undefined) updateData.order = body.order;
    if (body.defaultValue !== undefined) updateData.defaultValue = body.defaultValue;

    const updated = await prisma.customField.update({
      where: { id: fieldId },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/custom-fields/[fieldId] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fieldId } = await context.params;

    // Verify field exists and user has access
    const field = await prisma.customField.findUnique({
      where: { id: fieldId },
      include: {
        workspace: {
          include: { members: { where: { userId: user.id } } },
        },
      },
    });

    if (!field || field.workspace.members.length === 0) {
      return NextResponse.json({ error: "Field not found" }, { status: 404 });
    }

    await prisma.customField.delete({ where: { id: fieldId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/custom-fields/[fieldId] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
