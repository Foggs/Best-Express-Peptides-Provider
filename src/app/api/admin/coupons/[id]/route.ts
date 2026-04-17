import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyAdminAuth, createUnauthorizedResponse } from "@/lib/admin-auth"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verify admin authentication
  const auth = verifyAdminAuth(request)
  if (!auth.valid) {
    return createUnauthorizedResponse()
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { discountType, discountValue, isActive, expiresAt, maxUses, minOrderAmount } = body

    const coupon = await prisma.coupon.update({
      where: { id },
      data: {
        ...(discountType && { discountType }),
        ...(discountValue !== undefined && { discountValue }),
        ...(isActive !== undefined && { isActive }),
        ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
        ...(maxUses !== undefined && { maxUses }),
        ...(minOrderAmount !== undefined && { minOrderAmount }),
      },
    })

    return NextResponse.json(coupon)
  } catch (error) {
    console.error("Error updating coupon:", error)
    return NextResponse.json({ error: "Failed to update coupon" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verify admin authentication
  const auth = verifyAdminAuth(request)
  if (!auth.valid) {
    return createUnauthorizedResponse()
  }

  try {
    const { id } = await params
    await prisma.coupon.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting coupon:", error)
    return NextResponse.json({ error: "Failed to delete coupon" }, { status: 500 })
  }
}
