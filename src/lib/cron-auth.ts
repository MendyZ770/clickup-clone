import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

/**
 * Vercel cron jobs appellent les routes protégées avec
 * `Authorization: Bearer $CRON_SECRET`. Sans CRON_SECRET configuré, la route
 * reste fermée (fail-closed). Le secret n'est jamais accepté en query string.
 */
export function verifyCronSecret(request: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Cron is not configured on this environment" },
      { status: 501 }
    );
  }

  const bearer = request.headers.get("authorization");
  const fromBearer = bearer?.startsWith("Bearer ") ? bearer.slice(7) : null;
  const provided = fromBearer ?? request.headers.get("x-vercel-cron-secret");

  if (!provided) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const providedBuffer = Buffer.from(provided);
  const secretBuffer = Buffer.from(secret);
  if (
    providedBuffer.length !== secretBuffer.length ||
    !timingSafeEqual(providedBuffer, secretBuffer)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
