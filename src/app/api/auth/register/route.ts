import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";
import { DEFAULT_STATUSES } from "@/lib/constants";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;
    const normalizedEmail = email.trim().toLowerCase();

    const ip = getClientIp(request);
    const rate = await checkRateLimit(`register:ip:${ip}`, { limit: 3, windowMs: 60_000 });
    const accountRate = await checkRateLimit(`register:email:${normalizedEmail}`, {
      limit: 3,
      windowMs: 300_000,
    });
    if (!rate.success || !accountRate.success) {
      const reset = Math.max(rate.reset, accountRate.reset);
      return NextResponse.json(
        { error: "Trop de tentatives. Réessayez plus tard." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.max(1, Math.ceil((reset - Date.now()) / 1000))) },
        }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: "insensitive" } },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with default workspace, space, list, and statuses
    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        hashedPassword,
        workspaceMembers: {
          create: {
            role: "owner",
            workspace: {
              create: {
                name: `${name}'s Workspace`,
                spaces: {
                  create: {
                    name: "General",
                    description: "Default space",
                    order: 0,
                    lists: {
                      create: {
                        name: "Tasks",
                        order: 0,
                        statuses: {
                          create: DEFAULT_STATUSES.map((status) => ({
                            name: status.name,
                            color: status.color,
                            type: status.type,
                            order: status.order,
                          })),
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    });

    return NextResponse.json(
      { user, message: "Account created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
