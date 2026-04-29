import { randomBytes, createHash } from "crypto"

export const SETUP_TOKEN_TTL_MS = 24 * 60 * 60 * 1000

export function generateSetupToken(): { token: string; tokenHash: string; expiresAt: Date } {
  const token = randomBytes(32).toString("base64url")
  const tokenHash = hashSetupToken(token)
  const expiresAt = new Date(Date.now() + SETUP_TOKEN_TTL_MS)
  return { token, tokenHash, expiresAt }
}

export function hashSetupToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}
