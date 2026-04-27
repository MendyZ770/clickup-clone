import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const groupBy = searchParams.get("groupBy") ?? "task"; // task | user | date

    const where: Prisma.TimeEntryWhereInput = {
      duration: { not: null }, // Only completed entries
    };

    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) {
        (where.startTime as Prisma.DateTimeFilter).gte = new Date(startDate);
      }
      if (endDate) {
        (where.startTime as Prisma.DateTimeFilter).lte = new Date(endDate);
      }
    }

    // If workspaceId, filter by tasks in that workspace
    if (workspaceId) {
      where.task = {
        list: {
          space: {
            workspaceId,
          },
        },
      };
    }

    const entries = await prisma.timeEntry.findMany({
      where,
      include: {
        task: {
          select: { id: true, title: true, listId: true },
        },
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
      orderBy: { startTime: "desc" },
    });

    // Calculate total
    const totalSeconds = entries.reduce(
      (sum, entry) => sum + (entry.duration ?? 0),
      0
    );

    // Group entries
    type GroupItem = {
      key: string;
      label: string;
      totalSeconds: number;
      entryCount: number;
    };

    const groupMap = new Map<string, GroupItem>();

    for (const entry of entries) {
      let key: string;
      let label: string;

      if (groupBy === "user") {
        key = entry.userId;
        label = entry.user.name ?? entry.user.email;
      } else if (groupBy === "date") {
        const d = new Date(entry.startTime);
        key = d.toISOString().split("T")[0];
        label = key;
      } else {
        // group by task
        key = entry.taskId;
        label = entry.task.title;
      }

      const existing = groupMap.get(key);
      if (existing) {
        existing.totalSeconds += entry.duration ?? 0;
        existing.entryCount += 1;
      } else {
        groupMap.set(key, {
          key,
          label,
          totalSeconds: entry.duration ?? 0,
          entryCount: 1,
        });
      }
    }

    const breakdown = Array.from(groupMap.values()).sort(
      (a, b) => b.totalSeconds - a.totalSeconds
    );

    return NextResponse.json({
      totalSeconds,
      totalEntries: entries.length,
      groupBy,
      breakdown,
    });
  } catch (error) {
    console.error("GET /api/time-entries/report error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
