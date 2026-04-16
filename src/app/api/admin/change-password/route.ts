import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { verifyAdminAuth, createUnauthorizedResponse } from "@/lib/admin-auth"

export async function POST(request: NextRequest) {
  const auth = await verifyAdminAuth(request)
  if (!auth.valid || !auth.user) {
    return createUnauthorizedResponse()
  }

  try {
    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required" },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
    })

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "User not found or account does not use password login" },
        { status: 404 }
      )
    }

    const passwordMatch = await bcrypt.compare(currentPassword, user.password)
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 401 }
      )
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12)

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("Change password error:", error)
    return NextResponse.json(
      { error: "Failed to update password" },
      { status: 500 }
    )
  }
}
