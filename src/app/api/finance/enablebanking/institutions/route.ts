import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { fetchEnableBanking } from "@/lib/enablebanking";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
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
