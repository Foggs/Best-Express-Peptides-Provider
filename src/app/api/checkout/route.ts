import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
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

    let userId: string | null = null
    try {
      const authSession = await getServerSession(authOptions)
      if (authSession?.user?.email) {
        const user = await prisma.user.findUnique({
          where: { email: authSession.user.email },
          select: { id: true },
        })
        if (user) userId = user.id
      }
    } catch (authError) {
      console.error("Failed to resolve user session for order:", authError)
    }

    let persistedOrderNumber: string | null = null
    const MAX_ORDER_RETRIES = 3
    for (let attempt = 0; attempt < MAX_ORDER_RETRIES; attempt++) {
      const candidateOrderNumber = generateOrderNumber()
      try {
        const createdOrder = await prisma.order.create({
          data: {
            orderNumber: candidateOrderNumber,
            email,
            userId,
            status: "PENDING",
            subtotal,
            shipping,
            discount,
            tax: 0,
            total,
            couponCode: coupon?.code || null,
            shippingAddress: shippingAddress,
            items: {
              create: items.map((item: { productId: string; variantId: string; quantity: number; price: number }) => ({
                productId: item.productId,
                variantId: item.variantId,
                quantity: item.quantity,
                price: item.price,
              })),
            },
          },
          select: { orderNumber: true },
        })
        persistedOrderNumber = createdOrder.orderNumber
        break
      } catch (dbError: unknown) {
        const isPrismaError = typeof dbError === "object" && dbError !== null && "code" in dbError
        const isUniqueViolation = isPrismaError && (dbError as { code: string }).code === "P2002"
        if (isUniqueViolation && attempt < MAX_ORDER_RETRIES - 1) {
          continue
        }
        console.error("Failed to save order to database (stock already decremented):", dbError)
      }
    }

    const orderNumber = persistedOrderNumber || generateOrderNumber()

    const emailResult = await sendOrderEmail({
      email,
      items: items.map((item: { name: string; variantName: string; price: number; quantity: number }) => ({
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

    if (!persistedOrderNumber) {
      console.error("Order was NOT saved to database. Email fallback was attempted. Order number:", orderNumber)
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
