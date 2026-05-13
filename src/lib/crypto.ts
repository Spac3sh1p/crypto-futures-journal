import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

/**
 * Get the encryption key from environment.
 * Must be a 64-character hex string (32 bytes).
 * Returns null if not configured.
 */
function getEncryptionKey(): Buffer | null {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) return null;
  if (key.length !== 64 || !/^[0-9a-fA-F]+$/.test(key)) {
    console.error("ENCRYPTION_KEY must be a 64-character hex string (32 bytes)");
    return null;
  }
  return Buffer.from(key, "hex");
}

/**
 * Encrypt a plaintext string.
 * Returns a base64-encoded string containing iv + authTag + ciphertext.
 * If ENCRYPTION_KEY is not set, fails in production, passes through in dev.
 */
export function encryptSecret(plaintext: string): string {
  const key = getEncryptionKey();
  if (!key) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("ENCRYPTION_KEY is required in production");
    }
    // In dev without key, store as plaintext with a prefix marker
    return `plain:${plaintext}`;
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Format: iv (12 bytes) + authTag (16 bytes) + ciphertext
  const combined = Buffer.concat([iv, authTag, encrypted]);
  return `enc:${combined.toString("base64")}`;
}

/**
 * Decrypt an encrypted string.
 * Accepts the format produced by encryptSecret.
 * If ENCRYPTION_KEY is not set, fails in production, handles plain prefix in dev.
 */
export function decryptSecret(stored: string): string {
  // Handle plaintext fallback (dev mode without ENCRYPTION_KEY)
  if (stored.startsWith("plain:")) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Plaintext secrets not allowed in production");
    }
    return stored.slice(6);
  }

  // Handle legacy unencrypted values (pre-encryption migration)
  if (!stored.startsWith("enc:")) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Unencrypted secrets not allowed in production. Re-encrypt with ENCRYPTION_KEY.");
    }
    return stored; // legacy plaintext in dev
  }

  const key = getEncryptionKey();
  if (!key) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("ENCRYPTION_KEY is required in production");
    }
    throw new Error("ENCRYPTION_KEY is required to decrypt secrets");
  }

  const combined = Buffer.from(stored.slice(4), "base64");
  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString("utf8");
}
