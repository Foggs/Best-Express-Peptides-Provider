import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { authSession } from "@/lib/auth-session"
import { prisma } from "@/lib/prisma"
import { rateLimit, getRateLimitHeaders } from "@/lib/rate-limit"
import { checkoutDeps } from "@/lib/checkout-deps"
import { resolveCheckoutDiscount } from "@/lib/coupon"

const ORDER_NUMBER_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

function generateOrderNumber(): string {
  const rand = (n: number) => Math.floor(Math.random() * n)
  const group = () => Array.from({ length: 4 }, () => ORDER_NUMBER_CHARS[rand(ORDER_NUMBER_CHARS.length)]).join("")
  return `BE-${group()}-${group()}`
}

export async function POST(request: NextRequest) {
  const session = await authSession.getCheckoutSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const rateLimitResult = await rateLimit(request, 50, 60000)
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

    const stockCheck = await checkoutDeps.checkStock(stockItems)

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
      const product = await checkoutDeps.getCachedProductBySlug(item.slug)
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

    // Re-validate the coupon server-side.  Only the coupon CODE is extracted from
    // the client body — the client-supplied discount amount is never read.
    // resolveCheckoutDiscount() is the sole authority on discount computation.
    const { discount, verifiedCouponCode } = await resolveCheckoutDiscount(
      coupon?.code,
      subtotal,
    )

    const total = subtotal + shipping - discount

    let userId: string | null = null
    try {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      })
      if (user) userId = user.id
    } catch (authError) {
      console.error("Failed to resolve user ID for order:", authError)
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
            couponCode: verifiedCouponCode,
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
        const isUniqueViolation = dbError instanceof Prisma.PrismaClientKnownRequestError && dbError.code === "P2002"
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

    const decrementResult = await checkoutDeps.decrementStock(stockItems)

    if (!decrementResult.success) {
      console.error(
        `[checkout] Stock decrement failed for order ${orderNumber} after ${decrementResult.attempts ?? 0} attempt(s): ${decrementResult.error}`,
      )

      // Record the failure so an admin can reconcile inventory in the
      // sheet manually.  Never let a sheet-write failure silently swallow
      // an order — the customer's order exists in the DB and the on-sheet
      // stock count is now out of sync.
      try {
        await prisma.stockSyncFailure.create({
          data: {
            orderNumber,
            items: stockItems as unknown as Prisma.InputJsonValue,
            error: decrementResult.error ?? "Unknown stock decrement error",
            attempts: decrementResult.attempts ?? 0,
          },
        })
      } catch (recordError) {
        console.error(
          `[checkout] CRITICAL: Failed to record StockSyncFailure for order ${orderNumber}. Manual reconciliation required.`,
          recordError,
        )
      }

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

    let emailResult: { success: boolean; error?: string } = { success: false }
    try {
      emailResult = await checkoutDeps.sendOrderEmail({
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
        couponCode: verifiedCouponCode ?? undefined,
        orderNumber,
      })
    } catch (emailError) {
      console.error("Failed to send order confirmation email:", emailError)
    }

    if (!emailResult.success) {
      console.error("Order email not sent:", emailResult.error)
    }

    if (decrementResult.lowStockWarnings.length > 0) {
      try {
        await checkoutDeps.sendLowStockAlert(decrementResult.lowStockWarnings)
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
