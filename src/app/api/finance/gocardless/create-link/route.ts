import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGoCardlessClient } from "@/lib/gocardless";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, institutionId } = await req.json();

    if (!workspaceId || !institutionId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const client = await getGoCardlessClient();
    
    // In production, you would generate a URL that comes back to your domain
    const redirectUrl = process.env.NEXT_PUBLIC_APP_URL 
      ? `${process.env.NEXT_PUBLIC_APP_URL}/finance?gc_workspace=${workspaceId}` 
      : "http://localhost:3000/finance?gc_workspace=" + workspaceId;

    const init = await client.initSession({
      redirectUrl,
      institutionId,
      referenceId: uuidv4()
    });

    return NextResponse.json({ link: init.link, requisitionId: init.id });
  } catch (error: any) {
    console.error("Error creating GoCardless link:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
