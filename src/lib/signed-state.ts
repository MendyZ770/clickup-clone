import { createHmac, randomBytes, timingSafeEqual } from "crypto";

function getSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET must be set");
  return secret;
}

export function createSignedState(
  payload: Record<string, unknown>,
  maxAgeMs = 10 * 60 * 1000
): string {
  const body = Buffer.from(
    JSON.stringify({
      ...payload,
      nonce: randomBytes(16).toString("hex"),
      exp: Date.now() + maxAgeMs,
    })
  ).toString("base64url");
  const signature = createHmac("sha256", getSecret())
    .update(body)
    .digest("base64url");
  return `${body}.${signature}`;
}

export function verifySignedState<T>(state: string): T | null {
  const [body, signature] = state.split(".");
  if (!body || !signature) return null;

  const expected = createHmac("sha256", getSecret())
    .update(body)
    .digest("base64url");
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8")
    ) as Record<string, unknown>;
    if (typeof parsed.exp !== "number" || parsed.exp < Date.now()) return null;
    return parsed as T;
  } catch {
    return null;
  }
}
