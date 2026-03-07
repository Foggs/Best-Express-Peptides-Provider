import { NextRequest, NextResponse } from "next/server"
import { rateLimit, getRateLimitHeaders } from "@/lib/rate-limit"
import { sendOrderEmail } from "@/lib/orderEmail"

export async function POST(request: NextRequest) {
  const rateLimitResult = rateLimit(request, 50, 60000)
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { 
        status: 429,
        headers: getRateLimitHeaders(rateLimitResult.remaining, 50),
      }
    )
  }

  try {
    const body = await request.json()
    const { items, email, shippingAddress, coupon } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items in cart" }, { status: 400 })
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 })
    }

    if (!shippingAddress || !shippingAddress.firstName || !shippingAddress.lastName || !shippingAddress.address || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zipCode) {
      return NextResponse.json({ error: "Complete shipping address is required" }, { status: 400 })
    }

    const subtotal = items.reduce((acc: number, item: any) => acc + item.price * item.quantity, 0)
    const shipping = subtotal >= 20000 ? 0 : 1500
    const discount = coupon ? coupon.discount : 0
    const total = subtotal + shipping - discount

    const emailResult = await sendOrderEmail({
      email,
      items: items.map((item: any) => ({
        name: item.name,
        variantName: item.variantName,
        price: item.price,
        quantity: item.quantity,
      })),
      shippingAddress,
      subtotal,
      shipping,
      discount,
      total,
      couponCode: coupon?.code,
    })

    if (!emailResult.success) {
      console.error("Failed to send order email:", emailResult.error)
      return NextResponse.json(
        { error: "Failed to submit order. Please try again." },
        { 
          status: 500,
          headers: getRateLimitHeaders(rateLimitResult.remaining, 50),
        }
      )
    }

    return NextResponse.json(
      { success: true, message: "Order submitted successfully" },
      { headers: getRateLimitHeaders(rateLimitResult.remaining, 50) }
    )
  } catch (error) {
    console.error("Checkout error:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { error: "Error submitting order", details: message },
      { 
        status: 500,
        headers: getRateLimitHeaders(rateLimitResult.remaining, 50),
      }
    )
  }
}
