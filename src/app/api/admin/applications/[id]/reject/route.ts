import { NextRequest, NextResponse } from "next/server"
import { verifyAdminAuth, createUnauthorizedResponse } from "@/lib/admin-auth"
import { rejectApplicationDeps } from "./deps"

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
    const app = await rejectApplicationDeps.findApplication(id)
    if (!app) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    // Refuse to reject an application that has already been decided. Once an
    // application is APPROVED a setup link has been issued (and possibly used)
    // so silently flipping it to REJECTED would orphan the account. Once an
    // application is REJECTED the action is a no-op and we surface that
    // explicitly so the admin UI can react.
    if (app.status !== "PENDING") {
      return NextResponse.json(
        { error: `Application is already ${app.status.toLowerCase()}` },
        { status: 409 },
      )
    }

    await rejectApplicationDeps.setApplicationRejected(id)

    const fullName = `${app.firstName} ${app.lastName}`.trim()
    const emailResult = await rejectApplicationDeps.sendRejectionEmail({
      email: app.email,
      name: fullName,
    })

    if (!emailResult.success) {
      console.error("Rejection email failed for application", id, emailResult.error)
      return NextResponse.json(
        {
          success: true,
          warning: "Application rejected, but the notification email could not be sent.",
        },
        { status: 200 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Application rejection error:", err)
    return NextResponse.json({ error: "Failed to reject application" }, { status: 500 })
  }
}
