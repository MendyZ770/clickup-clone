import { NextResponse } from "next/server";
import { MOBILE_SESSION_COOKIE, verifyMobileToken } from "@/lib/auth-helpers";
import { revokeMobileToken } from "@/lib/mobile-token-store";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const cookieToken = (await cookies()).get(MOBILE_SESSION_COOKIE)?.value ?? null;
    const token = bearer ?? cookieToken;

    if (token) {
      const { payload } = await verifyMobileToken(token);
      if (payload.jti && payload.id && payload.exp) {
        await revokeMobileToken(
          payload.jti,
          payload.id as string,
          new Date(payload.exp * 1000)
        );
      }
    }
  } catch (error) {
    // Un token illisible n'a rien à révoquer : la déconnexion reste réussie.
    console.warn("[MOBILE_LOGOUT] token not revoked:", error);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(MOBILE_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
