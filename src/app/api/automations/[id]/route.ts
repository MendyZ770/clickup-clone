import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: automationId } = await params;

    // Verify ownership or list access
    const automation = await prisma.automation.findUnique({
      where: { id: automationId },
      include: {
        list: { include: { space: { include: { workspace: { include: { members: true } } } } } }
      }
    });

    if (!automation) {
      return NextResponse.json({ error: "Automation not found" }, { status: 404 });
    }

    const isMember = automation.list.space.workspace.members.some(m => m.userId === user.id);
    if (!isMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.automation.delete({
      where: { id: automationId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/automations/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
