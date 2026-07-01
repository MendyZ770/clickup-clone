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

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { members: true },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const isMember = workspace.members.some((m) => m.userId === user.id);
    if (!isMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get the first dashboard or create a default one
    let dashboards = await prisma.dashboard.findMany({
      where: { workspaceId },
      include: { widgets: true },
      orderBy: { createdAt: "asc" },
    });

    if (dashboards.length === 0) {
      const defaultDashboard = await prisma.dashboard.create({
        data: {
          name: "Vue d'ensemble",
          workspaceId,
          widgets: {
            create: [
              { type: "tasks-overview", x: 0, y: 0, w: 4, h: 2 },
              { type: "stat-cards", x: 4, y: 0, w: 8, h: 1 },
              { type: "activity-feed", x: 4, y: 1, w: 4, h: 2 },
            ],
          },
        },
        include: { widgets: true },
      });
      dashboards = [defaultDashboard];
    }

    return NextResponse.json(dashboards);
  } catch (error) {
    console.error("Failed to fetch dashboards:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
