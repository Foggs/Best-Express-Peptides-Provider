import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyAdminAuth, createUnauthorizedResponse } from "@/lib/admin-auth"

export async function GET(request: NextRequest) {
  // Verify admin authentication
  const auth = verifyAdminAuth(request)
  if (!auth.valid) {
    return createUnauthorizedResponse()
  }

  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(coupons)
  } catch (error) {
    console.error("Error fetching coupons:", error)
    return NextResponse.json({ error: "Failed to fetch coupons" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  // Verify admin authentication
  const auth = verifyAdminAuth(request)
  if (!auth.valid) {
    return createUnauthorizedResponse()
  }

  try {
    const body = await request.json()
    const { code, discountType, discountValue, isActive, expiresAt, maxUses, minOrderAmount } = body

    // Validate required fields
    if (!code || !discountType || !discountValue) {
      return NextResponse.json(
        { error: "Code, discountType, and discountValue are required" },
        { status: 400 }
      )
    }

    // Check if code already exists
    const existingCoupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    })

    if (existingCoupon) {
      return NextResponse.json(
        { error: "Coupon code already exists" },
        { status: 400 }
      )
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        discountType,
        discountValue,
        isActive: isActive ?? true,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        maxUses: maxUses ?? null,
        minOrderAmount: minOrderAmount ?? 0,
      },
    })

    return NextResponse.json(coupon, { status: 201 })
  } catch (error) {
    console.error("Error creating coupon:", error)
    return NextResponse.json({ error: "Failed to create coupon" }, { status: 500 })
  }
}
