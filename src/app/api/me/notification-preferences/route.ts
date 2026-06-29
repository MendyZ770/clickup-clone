import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const prefs = await prisma.notificationPreferences.findUnique({
    where: { userId: user.id },
  });

  // Retourner les valeurs par défaut si pas encore de préférences
  return NextResponse.json(prefs ?? {
    taskAssigned: true,
    taskComment: true,
    taskStatusChanged: true,
    taskDueSoon: true,
    dailySummary: true,
    reminders: true,
    teamActivity: true,
    budgetAlert: true,
    pushEnabled: true,
  });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const allowed = [
    "taskAssigned", "taskComment", "taskStatusChanged", "taskDueSoon",
    "dailySummary", "reminders", "teamActivity", "budgetAlert", "pushEnabled",
  ];

  const data: Record<string, boolean> = {};
  for (const key of allowed) {
    if (typeof body[key] === "boolean") data[key] = body[key];
  }

  const prefs = await prisma.notificationPreferences.upsert({
    where: { userId: user.id },
    update: data,
    create: { userId: user.id, ...data },
  });

  return NextResponse.json(prefs);
}
