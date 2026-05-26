import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

const SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || (() => { throw new Error("NEXTAUTH_SECRET must be set"); })()
);

export async function POST(req: NextRequest) {
  try {
    const forwardedFor = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const identifier = forwardedFor?.split(",")[0]?.trim() || realIp || "anonymous";

    const rateLimit = await checkRateLimit(identifier);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many requests", code: "RATE_LIMITED" },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil((rateLimit.reset - Date.now()) / 1000)) },
        }
      );
    }

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials", code: "USER_NOT_FOUND" },
        { status: 401 }
      );
    }

    if (!user.hashedPassword) {
      return NextResponse.json(
        { error: "No password set. Use web login first or create a password.", code: "NO_PASSWORD" },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, user.hashedPassword);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid credentials", code: "WRONG_PASSWORD" },
        { status: 401 }
      );
    }

    const token = await new SignJWT({
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(SECRET);

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
