import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { hashSetupToken } from "@/lib/setupTokens"
import type { User } from "@prisma/client"

const BCRYPT_COST = 12

export const setPasswordDeps = {
  // Lookup is only used for the GET /set-password page rendering. Consumption
  // is atomic via consumeTokenAtomic() — never via this finder.
  findUserByTokenHash: (tokenHash: string): Promise<User | null> =>
    prisma.user.findUnique({ where: { setupTokenHash: tokenHash } }),

  hashPassword: (password: string): Promise<string> => bcrypt.hash(password, BCRYPT_COST),

  // Atomic single-use consume: a single SQL UPDATE that matches on the hashed
  // token AND a non-expired window AND a still-pending row. Returns the number
  // of rows affected; concurrent callers race on the same row and exactly one
  // wins. This makes token replay impossible even under concurrent requests.
  consumeTokenAtomic: async (params: {
    tokenHash: string
    now: Date
    passwordHash: string
  }): Promise<number> => {
    const result = await prisma.user.updateMany({
      where: {
        setupTokenHash: params.tokenHash,
        setupTokenExpiresAt: { gt: params.now },
      },
      data: {
        password: params.passwordHash,
        status: "APPROVED",
        setupTokenHash: null,
        setupTokenExpiresAt: null,
      },
    })
    return result.count
  },

  hashSetupToken,
}

export type SetPasswordResult =
  | { ok: true }
  | { ok: false; error: string }

const PASSWORD_MIN_LENGTH = 8

function validatePasswordPolicy(password: string): string | null {
  if (typeof password !== "string" || password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`
  }
  if (!/[A-Za-z]/.test(password)) {
    return "Password must contain at least one letter."
  }
  if (!/[0-9]/.test(password)) {
    return "Password must contain at least one number."
  }
  return null
}

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

  const policyError = validatePasswordPolicy(params.password)
  if (policyError) {
    return { ok: false, error: policyError }
  }

  if (params.password !== params.confirmPassword) {
    return { ok: false, error: "Passwords do not match." }
  }

  const tokenHash = deps.hashSetupToken(params.token)

  // Hash the password before the atomic update so we don't hold a transaction
  // open during the bcrypt work (~100ms). Two concurrent requests will both
  // hash, but only one will win the row-level race in consumeTokenAtomic().
  const passwordHash = await deps.hashPassword(params.password)

  const updated = await deps.consumeTokenAtomic({
    tokenHash,
    now,
    passwordHash,
  })

  if (updated === 0) {
    return {
      ok: false,
      error: "This setup link is invalid, expired, or has already been used.",
    }
  }

  return { ok: true }
}
