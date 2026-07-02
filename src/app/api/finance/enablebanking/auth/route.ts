import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchEnableBanking } from "@/lib/enablebanking";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, bankName } = await req.json();

    if (!workspaceId || !bankName) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const redirectUrl = process.env.NEXT_PUBLIC_APP_URL 
      ? `${process.env.NEXT_PUBLIC_APP_URL}/finance` 
      : "http://localhost:3000/finance";

    // Pour retrouver à quel espace de travail on relie le compte après la redirection,
    // on peut utiliser le champ state (encode le workspaceId)
    const state = Buffer.from(JSON.stringify({ workspaceId, userId: session.user.id })).toString('base64');

    const authResponse = await fetchEnableBanking("/auth", {
      method: "POST",
      body: JSON.stringify({
        access: {
          valid_until: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 jours
        },
        aspsp: {
          name: bankName,
          country: "FR"
        },
        state: state,
        redirect_url: redirectUrl
      })
    });

    return NextResponse.json({ url: authResponse.url });
  } catch (error: any) {
    console.error("Error creating Enable Banking auth link:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
