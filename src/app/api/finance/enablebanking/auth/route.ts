import { NextResponse } from "next/server";
import { getCurrentUser, isWorkspaceMember } from "@/lib/auth-helpers";
import { fetchEnableBanking } from "@/lib/enablebanking";
import { createSignedState } from "@/lib/signed-state";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, bankName } = await req.json();

    if (!workspaceId || !bankName) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    if (!(await isWorkspaceMember(workspaceId, user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const redirectUrl = process.env.NEXT_PUBLIC_APP_URL 
      ? `${process.env.NEXT_PUBLIC_APP_URL}/finance` 
      : "http://localhost:3000/finance";

    // State signé (HMAC) et expirant, pour empêcher la falsification/CSRF
    const state = createSignedState({ workspaceId, userId: user.id });

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
