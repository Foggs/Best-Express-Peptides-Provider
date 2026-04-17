import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { validateCoupon } from "@/lib/coupon"

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

    const result = await validateCoupon(code, subtotal)

    if (!result.valid) {
      const status = result.message === "Coupon code not found" ? 404 : 400
      return NextResponse.json({ message: result.message }, { status })
    }

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error("Coupon validation error:", error)
    return NextResponse.json(
      { message: "Error validating coupon code" },
      { status: 500 }
    )
  }
}
