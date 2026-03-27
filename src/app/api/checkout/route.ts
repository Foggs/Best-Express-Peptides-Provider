import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { rateLimit, getRateLimitHeaders } from "@/lib/rate-limit"
import { sendOrderEmail } from "@/lib/orderEmail"
import { checkStock, decrementStock, getCachedProductBySlug } from "@/lib/productCache"

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

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items in cart" }, { status: 400 })
    }

    for (const item of items) {
      if (!item.slug || !item.variantName) {
        return NextResponse.json({ error: "Each item must have a slug and variantName" }, { status: 400 })
      }
      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        return NextResponse.json({ error: "Each item quantity must be a positive integer" }, { status: 400 })
      }
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

    const verifiedItems: { slug: string; variantName: string; quantity: number; price: number; productId: string; variantId: string; name: string }[] = []
    for (const item of items) {
      const product = await getCachedProductBySlug(item.slug)
      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${item.slug}` },
          { status: 400, headers: getRateLimitHeaders(rateLimitResult.remaining, 50) }
        )
      }
      const variant = product.variants.find(
        (v) => v.name.toLowerCase() === String(item.variantName).toLowerCase()
      )
      if (!variant) {
        return NextResponse.json(
          { error: `Variant "${item.variantName}" not found for product "${product.name}"` },
          { status: 400, headers: getRateLimitHeaders(rateLimitResult.remaining, 50) }
        )
      }
      if (item.price !== undefined && item.price !== variant.price) {
        console.warn(
          `Price mismatch for ${product.name} (${variant.name}): client sent ${item.price}, server price is ${variant.price}`
        )
      }
      verifiedItems.push({
        slug: item.slug,
        variantName: variant.name,
        quantity: item.quantity,
        price: variant.price,
        productId: product.id,
        variantId: variant.id,
        name: product.name,
      })
    }

    const subtotal = verifiedItems.reduce((acc, item) => acc + item.price * item.quantity, 0)
    const shipping = 0
    const discount = coupon ? coupon.discount : 0
    const total = subtotal + shipping - discount

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

    let orderNumber: string | null = null
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
              create: verifiedItems.map((item) => ({
                productId: item.productId,
                variantId: item.variantId,
                productName: item.name,
                variantName: item.variantName,
                quantity: item.quantity,
                price: item.price,
              })),
            },
          },
          select: { orderNumber: true },
        })
        orderNumber = createdOrder.orderNumber
        break
      } catch (dbError: unknown) {
        const isPrismaError = typeof dbError === "object" && dbError !== null && "code" in dbError
        const isUniqueViolation = isPrismaError && (dbError as { code: string }).code === "P2002"
        if (isUniqueViolation && attempt < MAX_ORDER_RETRIES - 1) {
          continue
        }
        console.error("Failed to save order to database:", dbError)
      }
    }

    if (!orderNumber) {
      return NextResponse.json(
        { error: "Failed to create order. Please try again." },
        { status: 500, headers: getRateLimitHeaders(rateLimitResult.remaining, 50) }
      )
    }

    const decrementResult = await decrementStock(stockItems)

    if (!decrementResult.success) {
      console.error("Failed to decrement stock after order created, cancelling order:", decrementResult.error)
      try {
        await prisma.order.update({
          where: { orderNumber },
          data: { status: "CANCELLED" },
        })
      } catch (cancelError) {
        console.error("Failed to cancel order after stock decrement failure:", cancelError)
      }
      return NextResponse.json(
        { error: "Failed to reserve inventory. Please try again." },
        { status: 500, headers: getRateLimitHeaders(rateLimitResult.remaining, 50) }
      )
    }

    const emailResult = await sendOrderEmail({
      email,
      items: verifiedItems.map((item) => ({
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
      console.error("Failed to send order confirmation email:", emailResult.error)
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
