import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";
import { DEFAULT_STATUSES } from "@/lib/constants";

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

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
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
        email,
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
