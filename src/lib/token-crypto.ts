import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const PREFIX = "enc:v1:";

function encryptionKey(): Buffer | null {
  const raw = process.env.OAUTH_ENCRYPTION_KEY;
  if (!raw) return null;
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error(
      "OAUTH_ENCRYPTION_KEY doit être 32 octets en base64 (générer avec crypto.randomBytes(32))"
    );
  }
  return key;
}

/**
 * Chiffre un token OAuth avant de le stocker. Sans clé configurée, la valeur
 * est laissée en clair (environnements de développement).
 */
export function encryptToken<T extends string | null | undefined>(
  plain: T
): T extends string ? string : null {
  if (plain == null) return null as T extends string ? string : null;
  const key = encryptionKey();
  if (!key) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "OAUTH_ENCRYPTION_KEY manquante : le chiffrement des tokens OAuth est obligatoire en production"
      );
    }
    return plain as unknown as T extends string ? string : null;
  }
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return `${PREFIX}${iv.toString("base64")}:${cipher.getAuthTag().toString("base64")}:${data.toString("base64")}` as T extends string ? string : null;
}

/** Déchiffre un token stocké. Les lignes antérieures (en clair) sont renvoyées telles quelles. */
export function decryptToken<T extends string | null | undefined>(
  stored: T
): T extends string ? string : null {
  if (stored == null) return null as T extends string ? string : null;
  if (!stored.startsWith(PREFIX)) return stored as unknown as T extends string ? string : null;
  const key = encryptionKey();
  if (!key) {
    throw new Error(
      "OAUTH_ENCRYPTION_KEY manquante : impossible de déchiffrer les tokens OAuth enregistrés"
    );
  }
  const [iv, tag, data] = stored.slice(PREFIX.length).split(":");
  if (!iv || !tag || !data) throw new Error("Token OAuth chiffré illisible");
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(data, "base64")),
    decipher.final(),
  ]).toString("utf8") as T extends string ? string : null;
}
