import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { hashSetupToken } from "@/lib/setupTokens"
import type { User } from "@prisma/client"

const BCRYPT_COST = 12

export const setPasswordDeps = {
  findUserByTokenHash: (tokenHash: string): Promise<User | null> =>
    prisma.user.findUnique({ where: { setupTokenHash: tokenHash } }),

  hashPassword: (password: string): Promise<string> => bcrypt.hash(password, BCRYPT_COST),

  consumeTokenAndSetPassword: (params: {
    userId: string
    passwordHash: string
  }): Promise<User> =>
    prisma.user.update({
      where: { id: params.userId },
      data: {
        password: params.passwordHash,
        status: "APPROVED",
        setupTokenHash: null,
        setupTokenExpiresAt: null,
      },
    }),

  hashSetupToken,
}

export type SetPasswordResult =
  | { ok: true }
  | { ok: false; error: string }

export async function consumeSetupToken(params: {
  token: string
  password: string
  confirmPassword: string
  now?: Date
  deps?: typeof setPasswordDeps
}): Promise<SetPasswordResult> {
  const deps = params.deps ?? setPasswordDeps
  const now = params.now ?? new Date()

  if (!params.token || typeof params.token !== "string") {
    return { ok: false, error: "Setup link is missing or invalid." }
  }

  if (typeof params.password !== "string" || params.password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." }
  }

  if (params.password !== params.confirmPassword) {
    return { ok: false, error: "Passwords do not match." }
  }

  const tokenHash = deps.hashSetupToken(params.token)
  const user = await deps.findUserByTokenHash(tokenHash)

  if (!user || !user.setupTokenExpiresAt) {
    return { ok: false, error: "This setup link is invalid or has already been used." }
  }

  if (user.setupTokenExpiresAt.getTime() < now.getTime()) {
    return { ok: false, error: "This setup link has expired. Please contact support." }
  }

  const passwordHash = await deps.hashPassword(params.password)
  await deps.consumeTokenAndSetPassword({ userId: user.id, passwordHash })

  return { ok: true }
}
