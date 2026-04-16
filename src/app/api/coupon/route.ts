import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { code, subtotal } = body

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { message: "Coupon code is required" },
        { status: 400 }
      )
    }

    if (!subtotal || typeof subtotal !== "number") {
      return NextResponse.json(
        { message: "Invalid order amount" },
        { status: 400 }
      )
    }

    // Find the coupon
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    })

    if (!coupon) {
      return NextResponse.json(
        { message: "Coupon code not found" },
        { status: 404 }
      )
    }

    // Check if coupon is active
    if (!coupon.isActive) {
      return NextResponse.json(
        { message: "This coupon code is no longer active" },
        { status: 400 }
      )
    }

    // Check if coupon has expired
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return NextResponse.json(
        { message: "This coupon code has expired" },
        { status: 400 }
      )
    }

    // Check usage limits
    if (coupon.maxUses && coupon.timesUsed >= coupon.maxUses) {
      return NextResponse.json(
        { message: "This coupon code has reached its usage limit" },
        { status: 400 }
      )
    }

    // Check minimum order amount
    if (subtotal < coupon.minOrderAmount) {
      return NextResponse.json(
        {
          message: `This coupon requires a minimum order of $${(coupon.minOrderAmount / 100).toFixed(2)}`,
        },
        { status: 400 }
      )
    }

    // Calculate discount
    let discount = 0
    if (coupon.discountType === "percentage") {
      discount = Math.floor((subtotal * coupon.discountValue) / 100)
    } else if (coupon.discountType === "fixed") {
      discount = coupon.discountValue
    }

    // Ensure discount doesn't exceed subtotal
    if (discount > subtotal) {
      discount = subtotal
    }

    return NextResponse.json(
      {
        success: true,
        couponCode: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discount: discount,
        message: `Coupon applied! You saved $${(discount / 100).toFixed(2)}`,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Coupon validation error:", error)
    return NextResponse.json(
      { message: "Error validating coupon code" },
      { status: 500 }
    )
  }
}
