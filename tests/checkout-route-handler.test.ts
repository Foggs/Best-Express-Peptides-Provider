import { NextRequest } from "next/server"
import { POST } from "../src/app/api/checkout/route"
import { prisma } from "../src/lib/prisma"
import { authSession } from "../src/lib/auth-session"
import { checkoutDeps } from "../src/lib/checkout-deps"

let passed = 0
let failed = 0

function assert(condition: boolean, msg: string) {
  if (condition) { console.log(`  ✓ ${msg}`); passed++ }
  else { console.error(`  ✗ FAIL: ${msg}`); failed++ }
}

async function run() {
  console.log("\nTest: POST /api/checkout — server-side coupon discount wiring\n")

  // Intercept the route's dynamic import("@/lib/orderEmail").
  const { createRequire } = await import("module")
  const _require = createRequire(import.meta.url)
  const nodeModule = _require("module") as { _load: Function }
  const origLoad = nodeModule._load
  nodeModule._load = function (id: string, ...rest: unknown[]) {
    if (id.includes("orderEmail") || id.includes("resend")) {
      return { sendOrderEmail: async () => ({ success: true }), sendLowStockAlert: async () => undefined }
    }
    return origLoad.call(this, id, ...rest)
  }

  try {
    // authSession and checkoutDeps are plain objects — mutating their
    // properties works in ESM (unlike reassigning named export bindings).
    authSession.getCheckoutSession = async () => ({ user: { email: "test@example.com" } } as any)

    const mockProduct = {
      id: "prod-test", name: "BPC-157",
      variants: [{ id: "var-test", name: "5mg", price: 5000 }],
    }
    checkoutDeps.getCachedProductBySlug = async () => mockProduct as any
    checkoutDeps.checkStock = async () => ({ success: true, insufficientItems: [] })
    checkoutDeps.decrementStock = async () => ({ success: true, lowStockWarnings: [] })

    // prisma is a class instance — method properties are always mutable.
    // Cast the delegate with `as any` to satisfy Prisma's fluent return types.
    ;(prisma.user as any).findUnique = async () => ({ id: "user-test" })
    ;(prisma.coupon as any).findUnique = async () => ({
      code: "SAVE10", isActive: true, expiresAt: null, maxUses: null,
      timesUsed: 0, minOrderAmount: 0, discountType: "percentage", discountValue: 10,
    })

    let capturedOrder: Record<string, unknown> = {}
    ;(prisma.order as any).create = async (args: any) => {
      capturedOrder = args.data
      return { orderNumber: "BE-TEST-0001" }
    }

    // Attacker sends coupon.discount: 99999 alongside the legitimate code.
    const req = new NextRequest("http://localhost/api/checkout", {
      method: "POST",
      body: JSON.stringify({
        items: [{ slug: "bpc-157", variantName: "5mg", quantity: 1 }],
        email: "buyer@example.com",
        shippingAddress: {
          firstName: "Jane", lastName: "Doe",
          address: "1 Main St", city: "Chicago", state: "IL", zipCode: "60601",
        },
        coupon: { code: "SAVE10", discount: 99999 },
      }),
      headers: { "Content-Type": "application/json" },
    })

    const res = await POST(req)
    const json = await res.json()

    assert(res.status === 200, `Route returns 200 (got ${res.status}: ${JSON.stringify(json)})`)

    const subtotal = 5000 // 1 × $50 product
    const expectedDiscount = Math.floor(subtotal * 10 / 100) // 500¢

    assert(
      capturedOrder.discount !== 99999,
      `order.discount (${capturedOrder.discount}¢) ≠ client-supplied 99999¢`,
    )
    assert(
      capturedOrder.discount === expectedDiscount,
      `order.discount = ${capturedOrder.discount}¢ (server-computed 10% of $50)`,
    )
    assert(
      capturedOrder.total === subtotal - expectedDiscount,
      `order.total = ${capturedOrder.total}¢ ($${((capturedOrder.total as number) / 100).toFixed(2)})`,
    )
    assert(
      capturedOrder.couponCode === "SAVE10",
      `order.couponCode = "${capturedOrder.couponCode}" (from DB, not raw client input)`,
    )

    console.log(`\n  coupon.discount in request: 99999¢  →  order.discount persisted: ${capturedOrder.discount}¢  ✓`)
  } finally {
    nodeModule._load = origLoad
  }
}

run()
  .then(() => {
    console.log(`\n──────────────────────────────────`)
    console.log(`Results: ${passed} passed, ${failed} failed`)
    console.log(`──────────────────────────────────\n`)
    if (failed > 0) process.exit(1)
  })
  .catch((err) => {
    console.error("Test error:", err)
    process.exit(1)
  })
