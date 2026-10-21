import { NextRequest, NextResponse } from "next/server";
import { MOBILE_SESSION_COOKIE, verifyMobileToken } from "@/lib/auth-helpers";
import { isMobileTokenRevoked } from "@/lib/mobile-token-store";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No token" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const { payload } = await verifyMobileToken(token);
    if (payload.jti && (await isMobileTokenRevoked(payload.jti))) {
      return NextResponse.json({ error: "Session révoquée" }, { status: 401 });
    }

    const response = NextResponse.json({
      id: payload.id,
      email: payload.email,
      name: payload.name,
      image: payload.image,
    });

    response.cookies.set(MOBILE_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
