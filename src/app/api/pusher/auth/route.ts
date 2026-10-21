import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isWorkspaceMember } from "@/lib/auth-helpers";
import { pusherServer } from "@/lib/pusher-server";

const bodySchema = z.object({
  socket_id: z.string().min(1),
  channel_name: z.string().min(1),
});

const CHAT_CHANNEL = /^private-list-([a-z0-9]+)-chat$/i;
const WORKSPACE_CHANNEL = /^private-workspace-([a-z0-9]+)$/i;

async function workspaceIdOfChannel(channelName: string): Promise<string | null> {
  const chat = channelName.match(CHAT_CHANNEL);
  if (chat?.[1]) {
    const list = await prisma.list.findUnique({
      where: { id: chat[1] },
      select: { space: { select: { workspaceId: true } } },
    });
    return list?.space.workspaceId ?? null;
  }
  const workspace = channelName.match(WORKSPACE_CHANNEL);
  return workspace?.[1] ?? null;
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Session expirée." }, { status: 401 });
    }

    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
    }
    const { socket_id, channel_name } = parsed.data;

    if (!channel_name.startsWith("private-")) {
      return NextResponse.json({ error: "Canal non autorisé." }, { status: 403 });
    }

    const workspaceId = await workspaceIdOfChannel(channel_name);
    if (!workspaceId) {
      return NextResponse.json({ error: "Canal introuvable." }, { status: 404 });
    }

    const member = await isWorkspaceMember(workspaceId, user.id);
    if (!member) {
      return NextResponse.json({ error: "Canal non autorisé." }, { status: 403 });
    }

    return NextResponse.json(pusherServer.authorizeChannel(socket_id, channel_name));
  } catch (error) {
    console.error("POST /api/pusher/auth error:", error);
    return NextResponse.json(
      { error: "Autorisation impossible." },
      { status: 500 }
    );
  }
}
