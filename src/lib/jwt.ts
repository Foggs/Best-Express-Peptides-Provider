/**
 * JWT secret loader.
 * Keeping this in its own module (no Next.js imports) makes it
 * importable in unit tests without a Next.js runtime.
 */

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error(
      "JWT_SECRET environment variable is not set. " +
      "Set it to a strong random string before starting the server."
    )
  }
  return secret
}
