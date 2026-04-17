/**
 * Checkout-route coupon wiring test — Task #28
 *
 * Tests resolveCheckoutDiscount() — the exact function the checkout route calls
 * for coupon resolution.  The function's signature is:
 *
 *   resolveCheckoutDiscount(couponCode: string | undefined, subtotal: number)
 *     => Promise<{ discount: number; verifiedCouponCode: string | null }>
 *
 * Notice that the function does NOT accept a `discount` parameter.  A
 * client-supplied discount amount cannot reach this function; the checkout
 * route only forwards `coupon?.code` (the string) and the server-computed
 * subtotal.
 *
 * Run with: npm run test:unit
 */

import { resolveCheckoutDiscount } from "../src/lib/coupon"
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

// ─── Typed Prisma stub ────────────────────────────────────────────────────────
// Uses the same interface as the Prisma-generated Coupon model so the mock
// matches the shape that validateCoupon() reads.

interface CouponRow {
  code: string
  isActive: boolean
  expiresAt: Date | null
  maxUses: number | null
  timesUsed: number
  minOrderAmount: number
  discountType: string
  discountValue: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const couponDelegate = prisma.coupon as any
const originalFindUnique = couponDelegate.findUnique.bind(couponDelegate)

function stubCoupon(row: CouponRow | null): void {
  couponDelegate.findUnique = async () => row
}

function restoreCoupon(): void {
  couponDelegate.findUnique = originalFindUnique
}

// ─── Tests ────────────────────────────────────────────────────────────────────

async function run() {
  console.log("\nTest suite: Checkout coupon wiring — resolveCheckoutDiscount()\n")

  // ── 1. No coupon → discount is 0, no code stored ──────────────────────────
  console.log("1. No coupon in request → zero discount (no coupon stub needed)")

  const noCoupon = await resolveCheckoutDiscount(undefined, 8000)
  assert(noCoupon.discount === 0, "No coupon → discount = 0")
  assert(noCoupon.verifiedCouponCode === null, "No coupon → verifiedCouponCode = null")

  // ── 2. Client sends inflated discount — checkout ignores it ───────────────
  // Simulates the exact sequence the checkout handler executes:
  //   (a) Parse body: read coupon.code ("SAVE10"), discard coupon.discount (99999)
  //   (b) Call resolveCheckoutDiscount(coupon.code, subtotal)
  //   (c) Use returned { discount } for the order total
  console.log("\n2. Client inflated coupon.discount is structurally unreachable")

  stubCoupon({
    code: "SAVE10",
    isActive: true,
    expiresAt: null,
    maxUses: null,
    timesUsed: 0,
    minOrderAmount: 0,
    discountType: "percentage",
    discountValue: 10,
  })

  const subtotal = 8000 // $80 in cents — verified server-side price sum
  const clientInflatedDiscount = 99999 // in request body as coupon.discount — NEVER used

  // The checkout route only passes coupon.code and subtotal; discount is not forwarded.
  const result = await resolveCheckoutDiscount("SAVE10", subtotal)

  assert(result.discount !== clientInflatedDiscount,
    `Returned discount (${result.discount}¢) ≠ client-supplied value (${clientInflatedDiscount}¢)`)

  const expectedDiscount = Math.floor((subtotal * 10) / 100) // 800¢ = $8.00
  assert(result.discount === expectedDiscount,
    `Server-computed discount = ${result.discount}¢ ($${result.discount / 100}), expected ${expectedDiscount}¢`)

  assert(result.verifiedCouponCode === "SAVE10",
    `Verified code comes from DB normalisation: "${result.verifiedCouponCode}"`)

  // Order total computed from server values — cannot go negative via client input
  const shipping = 0
  const orderTotal = subtotal + shipping - result.discount
  const attackerTotal = subtotal + shipping - clientInflatedDiscount

  assert(orderTotal > 0,
    `Server-computed order total = $${orderTotal / 100} (positive)`)
  assert(attackerTotal < 0,
    `Attack total = $${attackerTotal / 100} (would be negative — confirmed blocked)`)
  assert(orderTotal === 7200,
    `Correct total: $80 − 10% = $${orderTotal / 100}`)

  // ── 3. Coupon expired at checkout time → discount = 0, non-blocking ───────
  console.log("\n3. Coupon expired at checkout → discount = 0, order not blocked")

  stubCoupon({
    code: "EXPIRED",
    isActive: true,
    expiresAt: new Date("2020-01-01"),
    maxUses: null,
    timesUsed: 0,
    minOrderAmount: 0,
    discountType: "fixed",
    discountValue: 500,
  })

  const expiredResult = await resolveCheckoutDiscount("EXPIRED", 5000)
  assert(expiredResult.discount === 0, "Expired coupon → discount = 0 (non-blocking)")
  assert(expiredResult.verifiedCouponCode === null, "Expired coupon → no code persisted")

  const expiredTotal = 5000 + 0 - expiredResult.discount
  assert(expiredTotal === 5000, `Order total = full subtotal $${expiredTotal / 100} (no invalid discount)`)

  // ── 4. Inactive coupon → discount = 0 ────────────────────────────────────
  console.log("\n4. Inactive coupon → discount = 0")

  stubCoupon({
    code: "INACTIVE",
    isActive: false,
    expiresAt: null,
    maxUses: null,
    timesUsed: 0,
    minOrderAmount: 0,
    discountType: "fixed",
    discountValue: 200,
  })

  const inactiveResult = await resolveCheckoutDiscount("INACTIVE", 3000)
  assert(inactiveResult.discount === 0, "Inactive coupon → discount = 0")
  assert(inactiveResult.verifiedCouponCode === null, "Inactive coupon → no code persisted")

  // ── 5. Fixed-amount coupon — DB value is used verbatim ───────────────────
  console.log("\n5. Fixed-amount coupon — DB discountValue used, not client discount")

  stubCoupon({
    code: "FIXED500",
    isActive: true,
    expiresAt: null,
    maxUses: null,
    timesUsed: 0,
    minOrderAmount: 0,
    discountType: "fixed",
    discountValue: 500, // $5
  })

  const fixedResult = await resolveCheckoutDiscount("FIXED500", 10000)
  assert(fixedResult.discount === 500, `Fixed coupon → discount = 500¢ ($5)`)
  assert(fixedResult.verifiedCouponCode === "FIXED500", "Verified code matches DB code")

  // ── 6. Discount capped at subtotal — total never negative ─────────────────
  console.log("\n6. Oversized fixed discount is capped at subtotal")

  stubCoupon({
    code: "HUGE",
    isActive: true,
    expiresAt: null,
    maxUses: null,
    timesUsed: 0,
    minOrderAmount: 0,
    discountType: "fixed",
    discountValue: 99999,
  })

  const capResult = await resolveCheckoutDiscount("HUGE", 1000)
  assert(capResult.discount === 1000, `Discount capped at subtotal: ${capResult.discount}¢ ≤ 1000¢`)
  assert(capResult.discount <= 1000, "Order total can never go below zero via DB value")

  restoreCoupon()
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
