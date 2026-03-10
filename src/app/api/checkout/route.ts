import { NextRequest, NextResponse } from "next/server"
import { rateLimit, getRateLimitHeaders } from "@/lib/rate-limit"
import { sendOrderEmail } from "@/lib/orderEmail"
import { checkStock, decrementStock } from "@/lib/productCache"

const ORDER_NUMBER_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

function generateOrderNumber(): string {
  const rand = (n: number) => Math.floor(Math.random() * n)
  const group = () => Array.from({ length: 4 }, () => ORDER_NUMBER_CHARS[rand(ORDER_NUMBER_CHARS.length)]).join("")
  return `BE-${group()}-${group()}`
}

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

    const stockItems = items.map((item: any) => ({
      slug: item.slug,
      variantName: item.variantName,
      quantity: item.quantity,
    }))

    const stockCheck = await checkStock(stockItems)

    if (!stockCheck.success) {
      const details = stockCheck.insufficientItems.map(item => {
        if (item.available === 0) {
          return `${item.variantName} is out of stock`
        }
        return `${item.variantName} — only ${item.available} available (you requested ${item.requested})`
      })

      return NextResponse.json(
        {
          error: "Some items in your cart are no longer available",
          stockError: true,
          insufficientItems: stockCheck.insufficientItems,
          details,
        },
        {
          status: 409,
          headers: getRateLimitHeaders(rateLimitResult.remaining, 50),
        }
      )
    }

    const subtotal = items.reduce((acc: number, item: any) => acc + item.price * item.quantity, 0)
    const shipping = subtotal >= 20000 ? 0 : 1500
    const discount = coupon ? coupon.discount : 0
    const total = subtotal + shipping - discount

    const decrementResult = await decrementStock(stockItems)

    if (!decrementResult.success) {
      console.error("Failed to decrement stock:", decrementResult.error)
      return NextResponse.json(
        { error: "Failed to reserve inventory. Please try again." },
        {
          status: 500,
          headers: getRateLimitHeaders(rateLimitResult.remaining, 50),
        }
      )
    }

    const orderNumber = generateOrderNumber()

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
      orderNumber,
    })

    if (!emailResult.success) {
      console.error("Failed to send order email (stock already decremented):", emailResult.error)
    }

    if (decrementResult.lowStockWarnings.length > 0) {
      try {
        const { sendLowStockAlert } = await import("@/lib/orderEmail")
        await sendLowStockAlert(decrementResult.lowStockWarnings)
      } catch (alertError) {
        console.error("Failed to send low stock alert:", alertError)
      }
    }

    return NextResponse.json(
      { success: true, message: "Order submitted successfully", orderNumber },
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
