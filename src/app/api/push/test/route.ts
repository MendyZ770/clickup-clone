import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { sendNotificationToUsers } from "@/lib/notifications";

// Route de test — à supprimer en prod
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Voir les subscriptions enregistrées pour cet user
  const subs = await prisma.pushSubscription.findMany({
    where: { userId: user.id },
    select: { id: true, provider: true, fcmToken: true, endpoint: true, createdAt: true },
  });

  if (subs.length === 0) {
    return NextResponse.json({
      error: "Aucune subscription trouvée pour cet utilisateur",
      userId: user.id,
    }, { status: 404 });
  }

  await sendNotificationToUsers(
    [user.id],
    {
      type: "reminder",
      message: "🎉 Test push — ça marche !",
      link: "/dashboard",
      title: "Done — Test",
      body: "Si tu vois ça, les notifications push fonctionnent.",
      tag: "test",
    }
  );

  return NextResponse.json({
    ok: true,
    subscriptions: subs,
    message: `Push envoyé à ${subs.length} appareil(s)`,
  });
}
