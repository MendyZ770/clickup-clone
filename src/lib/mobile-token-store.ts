import { prisma } from "@/lib/prisma";

// Cache pure-positif : une fois un jti reconnu révoqué, on évite de le re-chercher
// jusqu'à son expiration réelle. Les entrées expirées sont purgées à chaque écriture.
const revokedCache = new Map<string, number>();

function remember(jti: string, expiresAt: Date) {
  const now = Date.now();
  for (const [key, exp] of revokedCache) if (exp <= now) revokedCache.delete(key);
  revokedCache.set(jti, expiresAt.getTime());
}

export async function isMobileTokenRevoked(jti: string): Promise<boolean> {
  if (revokedCache.get(jti)) return true;
  const revoked = await prisma.revokedMobileToken.findUnique({
    where: { jti },
    select: { jti: true, expiresAt: true },
  });
  if (!revoked) return false;
  remember(revoked.jti, revoked.expiresAt);
  return true;
}

export async function revokeMobileToken(
  jti: string,
  userId: string,
  expiresAt: Date
): Promise<void> {
  await prisma.revokedMobileToken.upsert({
    where: { jti },
    update: {},
    create: { jti, userId, expiresAt },
  });
  remember(jti, expiresAt);
  await prisma.revokedMobileToken
    .deleteMany({ where: { expiresAt: { lt: new Date() } } })
    .catch(() => undefined);
}
