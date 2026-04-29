import { NextRequest, NextResponse } from "next/server"
import { verifyAdminAuth, createUnauthorizedResponse } from "@/lib/admin-auth"
import { approveApplicationDeps } from "./deps"

function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://bestexpresspeptides.com"
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = verifyAdminAuth(request)
  if (!auth.valid) return createUnauthorizedResponse()

  const { id } = await context.params
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Application id is required" }, { status: 400 })
  }

  try {
    const app = await approveApplicationDeps.findApplication(id)
    if (!app) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    // Allow re-triggering approval for already-APPROVED applications: the admin
    // may need to reissue a fresh setup link if the previous one expired or the
    // welcome email was lost. Re-issuing is blocked once the provider has
    // actually set their password.
    const existingUser = await approveApplicationDeps.findUserByEmail(app.email)
    if (existingUser?.password) {
      return NextResponse.json(
        { error: "An account with this email already has a password set" },
        { status: 409 },
      )
    }

    const isReissue = app.status === "APPROVED"

    const { token, tokenHash, expiresAt } = approveApplicationDeps.generateSetupToken()
    const fullName = `${app.firstName} ${app.lastName}`.trim()

    if (isReissue) {
      // Reissue: application is already APPROVED — only refresh the user's
      // setup token. Single write, no transaction needed.
      await approveApplicationDeps.upsertUserWithSetupToken({
        email: app.email,
        name: fullName,
        setupTokenHash: tokenHash,
        setupTokenExpiresAt: expiresAt,
      })
    } else {
      // First-time approval: upsert user with token AND mark application
      // APPROVED in a single DB transaction so partial failures roll back
      // and we never leave a token issued without the matching status flip.
      await approveApplicationDeps.upsertUserAndApproveApplication({
        email: app.email,
        name: fullName,
        setupTokenHash: tokenHash,
        setupTokenExpiresAt: expiresAt,
        applicationId: id,
      })
    }

    const setupUrl = `${getSiteUrl().replace(/\/$/, "")}/auth/set-password?token=${encodeURIComponent(token)}`

    const emailResult = await approveApplicationDeps.sendWelcomeEmail({
      email: app.email,
      name: fullName,
      setupUrl,
    })

    if (!emailResult.success) {
      console.error("Welcome email failed for application", id, emailResult.error)
      return NextResponse.json(
        {
          success: true,
          warning: "Application approved, but the welcome email could not be sent.",
        },
        { status: 200 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Application approval error:", err)
    return NextResponse.json({ error: "Failed to approve application" }, { status: 500 })
  }
}
