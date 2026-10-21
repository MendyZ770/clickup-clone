import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { jwtVerify } from "jose";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isMobileTokenRevoked } from "@/lib/mobile-token-store";

export const MOBILE_SESSION_COOKIE = "mobile_session";
export const GCAL_OAUTH_STATE_COOKIE = "gcal_oauth_state";

const getSecret = () => new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || (() => { throw new Error("NEXTAUTH_SECRET must be set"); })()
);

const userSelect = {
  id: true,
  name: true,
  email: true,
  image: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function verifyMobileToken(token: string) {
  return jwtVerify(token, getSecret(), { clockTolerance: 60 });
}

async function getUserFromMobileToken(token: string) {
  const { payload } = await verifyMobileToken(token);
  if (!payload.id) return null;
  if (payload.jti && (await isMobileTokenRevoked(payload.jti))) return null;
  return prisma.user.findUnique({
    where: { id: payload.id as string },
    select: userSelect,
  });
}

export async function getCurrentUser() {
  // 1. Mobile JWT (Authorization header or httpOnly cookie)
  try {
    const h = await headers();
    const authHeader = h.get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;
    const cookieToken = (await cookies()).get(MOBILE_SESSION_COOKIE)?.value ?? null;
    const mobileToken = bearerToken ?? cookieToken;

    if (mobileToken) {
      const user = await getUserFromMobileToken(mobileToken);
      if (user) return user;
    }
  } catch {
    // token invalid, continue to NextAuth cookie check
  }

  // 2. Fallback to NextAuth cookie session
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: userSelect,
  });

  return user;
}

export async function isWorkspaceMember(workspaceId: string, userId: string) {
  const membership = await prisma.workspaceMember.findFirst({
    where: { workspaceId, userId },
    select: { id: true },
  });
  return !!membership;
}

export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
