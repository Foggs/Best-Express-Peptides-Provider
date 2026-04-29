import { prisma } from "@/lib/prisma"
import { generateSetupToken as _generateSetupToken } from "@/lib/setupTokens"
import { sendProviderWelcomeEmail } from "@/lib/welcomeEmail"
import type { ProviderApplication, User } from "@prisma/client"

export interface ApprovalEmailData {
  email: string
  name: string
  setupUrl: string
}

export const approveApplicationDeps = {
  generateSetupToken: _generateSetupToken,

  findApplication: (id: string): Promise<ProviderApplication | null> =>
    prisma.providerApplication.findUnique({ where: { id } }),

  findUserByEmail: (email: string): Promise<User | null> =>
    prisma.user.findUnique({ where: { email } }),

  upsertUserWithSetupToken: (params: {
    email: string
    name: string
    setupTokenHash: string
    setupTokenExpiresAt: Date
  }): Promise<User> =>
    prisma.user.upsert({
      where: { email: params.email },
      create: {
        email: params.email,
        name: params.name,
        status: "PENDING",
        setupTokenHash: params.setupTokenHash,
        setupTokenExpiresAt: params.setupTokenExpiresAt,
      },
      update: {
        name: params.name,
        // Force status back to PENDING so the atomic consume in
        // /auth/set-password (which requires status=PENDING) succeeds.
        // Safe because the caller has already verified password === null
        // — we never downgrade a real signed-up user.
        status: "PENDING",
        setupTokenHash: params.setupTokenHash,
        setupTokenExpiresAt: params.setupTokenExpiresAt,
      },
    }),

  setApplicationApproved: (id: string): Promise<ProviderApplication> =>
    prisma.providerApplication.update({
      where: { id },
      data: { status: "APPROVED" },
    }),

  // Atomic approval write: upsert the user with the new setup token AND
  // mark the application APPROVED in a single transaction so a transient
  // DB error cannot leave the user with a token while the application
  // stays PENDING (or vice versa). Used on first-time approval only.
  upsertUserAndApproveApplication: (params: {
    email: string
    name: string
    setupTokenHash: string
    setupTokenExpiresAt: Date
    applicationId: string
  }): Promise<unknown> =>
    prisma.$transaction([
      prisma.user.upsert({
        where: { email: params.email },
        create: {
          email: params.email,
          name: params.name,
          status: "PENDING",
          setupTokenHash: params.setupTokenHash,
          setupTokenExpiresAt: params.setupTokenExpiresAt,
        },
        update: {
          name: params.name,
          status: "PENDING",
          setupTokenHash: params.setupTokenHash,
          setupTokenExpiresAt: params.setupTokenExpiresAt,
        },
      }),
      prisma.providerApplication.update({
        where: { id: params.applicationId },
        data: { status: "APPROVED" },
      }),
    ]),

  sendWelcomeEmail: (data: ApprovalEmailData) => sendProviderWelcomeEmail(data),
}
