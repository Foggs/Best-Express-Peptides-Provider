import { NextRequest } from "next/server"
import { Prisma } from "@prisma/client"
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
  console.log("\nTest: POST /api/checkout — P2002 unique-constraint retry (instanceof check)\n")

  authSession.getCheckoutSession = async () => ({ user: { email: "retry@example.com" } } as any)

  const mockProduct = {
    id: "prod-retry",
    name: "TB-500",
    variants: [{ id: "var-retry", name: "10mg", price: 7500 }],
  }
  checkoutDeps.getCachedProductBySlug = async () => mockProduct as any
  checkoutDeps.checkStock = async () => ({ success: true, insufficientItems: [] })
  checkoutDeps.decrementStock = async () => ({ success: true, lowStockWarnings: [] })
  checkoutDeps.sendOrderEmail = async () => ({ success: true })
  checkoutDeps.sendLowStockAlert = async () => ({ success: true })

  ;(prisma.user as any).findUnique = async () => null
  ;(prisma.coupon as any).findUnique = async () => null

  // ── Test 1: P2002 on first attempt → handler retries → 200 ──────────
  console.log("1. P2002 on first attempt triggers retry, second attempt succeeds")

  let createCallCount = 0
  ;(prisma.order as any).create = async () => {
    createCallCount++
    if (createCallCount === 1) {
      throw new Prisma.PrismaClientKnownRequestError(
        "Unique constraint failed on the fields: (`orderNumber`)",
        { code: "P2002", clientVersion: "5.0.0" },
      )
    }
    return { orderNumber: "BE-RETRY-0001" }
  }

  const req1 = new NextRequest("http://localhost/api/checkout", {
    method: "POST",
    body: JSON.stringify({
      items: [{ slug: "tb-500", variantName: "10mg", quantity: 1 }],
      email: "retry@example.com",
      shippingAddress: {
        firstName: "Bob", lastName: "Smith",
        address: "2 Test Ave", city: "Los Angeles", state: "CA", zipCode: "90001",
      },
    }),
    headers: { "Content-Type": "application/json" },
  })

  const res1 = await POST(req1)
  const json1 = await res1.json()

  assert(createCallCount === 2, `order.create called ${createCallCount}× (expected 2: 1 P2002 + 1 success)`)
  assert(res1.status === 200, `Route returns 200 after retry (got ${res1.status})`)
  assert(json1.orderNumber === "BE-RETRY-0001", `Order number from second attempt: "${json1.orderNumber}"`)

  // ── Test 2: non-P2002 Prisma error on first attempt → no early exit ──
  console.log("\n2. Non-P2002 Prisma error — loop exhausts all attempts, route returns 500")

  let createCallCount2 = 0
  ;(prisma.order as any).create = async () => {
    createCallCount2++
    throw new Prisma.PrismaClientKnownRequestError(
      "Some other Prisma error",
      { code: "P2025", clientVersion: "5.0.0" },
    )
  }

  const req2 = new NextRequest("http://localhost/api/checkout", {
    method: "POST",
    body: JSON.stringify({
      items: [{ slug: "tb-500", variantName: "10mg", quantity: 1 }],
      email: "retry@example.com",
      shippingAddress: {
        firstName: "Bob", lastName: "Smith",
        address: "2 Test Ave", city: "Los Angeles", state: "CA", zipCode: "90001",
      },
    }),
    headers: { "Content-Type": "application/json" },
  })

  const res2 = await POST(req2)
  const json2 = await res2.json()

  assert(
    createCallCount2 === 3,
    `non-P2002 error: order.create called ${createCallCount2}× (loop exhausts all 3 attempts without early exit)`,
  )
  assert(res2.status !== 200, `non-P2002 error: route does NOT return 200 (got ${res2.status})`)
  assert(typeof json2.error === "string", `non-P2002 error: response has error field: "${json2.error}"`)
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
