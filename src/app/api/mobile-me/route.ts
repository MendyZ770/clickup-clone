import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const getSecret = () => new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || (() => { throw new Error("NEXTAUTH_SECRET must be set"); })()
);

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No token" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const { payload } = await jwtVerify(token, getSecret(), {
      clockTolerance: 60,
    });

    return NextResponse.json({
      id: payload.id,
      email: payload.email,
      name: payload.name,
      image: payload.image,
    });
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
