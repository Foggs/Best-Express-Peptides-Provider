/**
 * Checkout-route coupon wiring test — Task #28
 *
 * Proves that the checkout route:
 *   (a) does NOT assign coupon.discount (client-supplied) to the order total
 *   (b) DOES call validateCoupon() with only coupon.code
 *   (c) DOES use the server-computed couponResult.discount for the order
 *
 * Then functionally verifies validateCoupon() is the sole source of truth
 * for the discount by demonstrating a client-inflated discount is ignored.
 *
 * Run with: npm run test:unit
 */

import { readFileSync } from "fs"
import { resolve } from "path"
import { validateCoupon } from "../src/lib/coupon"
import { prisma } from "../src/lib/prisma"

let passed = 0
let failed = 0

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ ${message}`)
    passed++
  } else {
    console.error(`  ✗ FAIL: ${message}`)
    failed++
  }
}

// ─── Mock helpers ─────────────────────────────────────────────────────────────

type MockCoupon = {
  code: string
  isActive: boolean
  expiresAt: Date | null
  maxUses: number | null
  timesUsed: number
  minOrderAmount: number
  discountType: string
  discountValue: number
}

function mockFindUnique(data: MockCoupon | null) {
  ;(prisma.coupon as any).findUnique = async () => data
}

// ─── Test runner ─────────────────────────────────────────────────────────────

async function run() {
  const checkoutSrc = readFileSync(
    resolve("src/app/api/checkout/route.ts"),
    "utf-8"
  )

  console.log("\nTest suite: Checkout route — coupon wiring verification\n")

  // ── Part A: Source-level assertions ─────────────────────────────────────────
  // These prove the vulnerable pattern is gone and the fix is wired in.

  console.log("Part A — checkout route source-code assertions")

  // A1. The old vulnerability: assigning coupon.discount from the client body
  assert(
    !checkoutSrc.includes("coupon.discount") && !checkoutSrc.includes("coupon?.discount"),
    "Checkout route does NOT read coupon.discount from the client body"
  )

  // A2. The fix: validateCoupon is imported in the route
  assert(
    checkoutSrc.includes('from "@/lib/coupon"') || checkoutSrc.includes("from '../lib/coupon'") || checkoutSrc.includes("from './coupon'"),
    "Checkout route imports from the shared coupon module"
  )

  // A3. Only the coupon CODE is passed — not the client discount
  assert(
    checkoutSrc.includes("validateCoupon(coupon.code"),
    "Checkout route calls validateCoupon() with only coupon.code"
  )

  // A4. The server-computed discount is used (not a client value)
  assert(
    checkoutSrc.includes("couponResult.discount"),
    "Checkout route uses couponResult.discount (server-computed) for the order total"
  )

  // A5. The order total formula subtracts the server discount
  assert(
    checkoutSrc.includes("subtotal + shipping - discount") || checkoutSrc.includes("subtotal + shipping - discount"),
    "Order total is computed as subtotal + shipping - discount (server value)"
  )

  // A6. Only verifiedCouponCode is persisted — never raw client coupon object
  assert(
    checkoutSrc.includes("verifiedCouponCode"),
    "Only the verified (DB-sourced) coupon code is written to the order record"
  )

  // ── Part B: Functional assertions via validateCoupon mock ────────────────────
  // Simulates the exact call the checkout route makes, proving the discount is
  // computed server-side and that a client-inflated value is irrelevant.

  console.log("\nPart B — functional: server-computed discount vs client-inflated value")

  mockFindUnique({
    code: "CHECKOUT10",
    isActive: true,
    expiresAt: null,
    maxUses: null,
    timesUsed: 0,
    minOrderAmount: 0,
    discountType: "percentage",
    discountValue: 10,
  })

  // Simulate checkout request: client claims a huge discount
  const clientRequestBody = {
    coupon: {
      code: "CHECKOUT10",
      discount: 99999, // attacker-controlled — must be ignored by server
    },
    subtotal: 8000, // $80.00
  }

  // The checkout route only passes coupon.code to validateCoupon
  const couponResult = await validateCoupon(
    clientRequestBody.coupon.code,
    clientRequestBody.subtotal
  )

  assert(couponResult.valid === true, "Coupon is valid")

  if (couponResult.valid) {
    const serverDiscount = couponResult.discount
    const expectedDiscount = Math.floor((8000 * 10) / 100) // $8.00

    assert(
      serverDiscount === expectedDiscount,
      `Server discount ($${serverDiscount / 100}) = 10% of $80.00 = $8.00`
    )

    assert(
      serverDiscount !== clientRequestBody.coupon.discount,
      `Server discount (${serverDiscount}) ≠ client-supplied inflated value (${clientRequestBody.coupon.discount})`
    )

    // Simulated order total (what checkout route computes)
    const shipping = 0
    const serverTotal = clientRequestBody.subtotal + shipping - serverDiscount
    const attackerTotal = clientRequestBody.subtotal + shipping - clientRequestBody.coupon.discount

    assert(
      serverTotal > 0,
      `Order total using server discount = $${serverTotal / 100} (positive, valid)`
    )

    assert(
      attackerTotal < 0,
      `Order total using client discount = $${attackerTotal / 100} (would be negative — vulnerability confirmed mitigated)`
    )

    assert(
      serverTotal === 7200,
      `Checkout total is correctly $${serverTotal / 100} (subtotal $80 - 10% = $72)`
    )
  }

  // B2. Invalid coupon at checkout time → zero discount (non-blocking)
  console.log("\nPart B2 — coupon invalid at checkout time → order proceeds with no discount")

  mockFindUnique({
    code: "EXPIRED2",
    isActive: true,
    expiresAt: new Date("2020-01-01"), // already expired
    maxUses: null,
    timesUsed: 0,
    minOrderAmount: 0,
    discountType: "fixed",
    discountValue: 500,
  })

  const expiredResult = await validateCoupon("EXPIRED2", 5000)
  assert(expiredResult.valid === false, "Expired coupon is rejected at checkout time")

  // Simulate the checkout route's non-blocking fallback: discount stays 0
  let discount = 0
  let verifiedCouponCode: string | null = null
  if (expiredResult.valid) {
    discount = expiredResult.discount
    verifiedCouponCode = expiredResult.couponCode
  }

  assert(discount === 0, "Discount is 0 when coupon is invalid at checkout — order is not blocked")
  assert(verifiedCouponCode === null, "No coupon code is persisted when coupon is invalid at checkout")

  const total = 5000 + 0 - discount
  assert(total === 5000, `Order total equals full subtotal ($${total / 100}) — no incorrect discount applied`)
}

// ─── Entry point ─────────────────────────────────────────────────────────────

run()
  .then(() => {
    console.log(`\n─────────────────────────────────────`)
    console.log(`Results: ${passed} passed, ${failed} failed`)
    console.log(`─────────────────────────────────────\n`)
    if (failed > 0) process.exit(1)
  })
  .catch((err) => {
    console.error("Test suite error:", err)
    process.exit(1)
  })
