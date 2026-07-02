import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchEnableBanking } from "@/lib/enablebanking";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // L'API Enable Banking demande souvent un pays. Par défaut, on va filtrer sur la France.
    // L'endpoint est /aspsps (Account Servicing Payment Service Providers)
    const aspsps = await fetchEnableBanking("/aspsps?country=FR");
    
    return NextResponse.json(aspsps);
  } catch (error: any) {
    console.error("Error fetching Enable Banking institutions:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
