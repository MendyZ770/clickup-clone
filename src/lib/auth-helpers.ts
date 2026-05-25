import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { jwtVerify } from "jose";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || (() => { throw new Error("NEXTAUTH_SECRET must be set"); })()
);

export async function getCurrentUser() {
  // 1. Try mobile token from Authorization header
  try {
    const h = await headers();
    const authHeader = h.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const { payload } = await jwtVerify(token, SECRET, { clockTolerance: 60 });
      if (payload.id) {
        const user = await prisma.user.findUnique({
          where: { id: payload.id as string },
          select: { id: true, name: true, email: true, image: true, createdAt: true, updatedAt: true },
        });
        if (user) return user;
      }
    }
  } catch {
    // token invalid, continue to cookie check
  }

  // 2. Fallback to NextAuth cookie session
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
}

export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
