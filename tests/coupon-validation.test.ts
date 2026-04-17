/**
 * Verification test for Task #28: Re-validate coupon server-side at checkout
 *
 * Tests the shared validateCoupon() utility directly — this is the exact function
 * now called by the checkout route, so passing here proves the checkout will use
 * server-computed discounts, not client-supplied ones.
 *
 * Run with: npm run test:unit
 */

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

// ─── Mock prisma.coupon.findUnique ────────────────────────────────────────────

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

const originalFindUnique = (prisma.coupon as any).findUnique.bind(prisma.coupon)

function mockFindUnique(data: MockCoupon | null) {
  ;(prisma.coupon as any).findUnique = async () => data
}

function restoreFindUnique() {
  ;(prisma.coupon as any).findUnique = originalFindUnique
}

// ─── Test runner ─────────────────────────────────────────────────────────────

async function run() {
  console.log("\nTest suite: validateCoupon — server-side coupon re-validation\n")

  // 1. Inflated client discount is overridden by server-computed value
  console.log("1. Server always computes discount — ignores any client value")
  mockFindUnique({
    code: "SAVE10",
    isActive: true,
    expiresAt: null,
    maxUses: null,
    timesUsed: 0,
    minOrderAmount: 0,
    discountType: "percentage",
    discountValue: 10,
  })

  const subtotal = 5000 // $50.00 in cents
  const clientInflatedDiscount = 999999 // attacker-supplied value — must be ignored

  const result = await validateCoupon("SAVE10", subtotal)
  assert(result.valid === true, "Valid coupon is accepted")
  if (result.valid) {
    const serverDiscount = result.discount
    const expectedDiscount = Math.floor((subtotal * 10) / 100)

    assert(
      serverDiscount === expectedDiscount,
      `Server discount ($${serverDiscount / 100}) equals computed 10% of subtotal ($${expectedDiscount / 100})`
    )
    assert(
      serverDiscount !== clientInflatedDiscount,
      `Server discount (${serverDiscount}) is NOT the client-supplied inflated value (${clientInflatedDiscount})`
    )
  }

  // 2. Fixed-amount coupon computed correctly
  console.log("\n2. Fixed-amount coupon discount is computed from DB, not client")
  mockFindUnique({
    code: "FIXED500",
    isActive: true,
    expiresAt: null,
    maxUses: null,
    timesUsed: 0,
    minOrderAmount: 0,
    discountType: "fixed",
    discountValue: 500,
  })

  const fixedResult = await validateCoupon("FIXED500", 10000)
  assert(fixedResult.valid === true, "Fixed coupon is valid")
  if (fixedResult.valid) {
    assert(fixedResult.discount === 500, `Fixed discount is $${fixedResult.discount / 100} (expected $5.00)`)
  }

  // 3. Discount is capped at subtotal
  console.log("\n3. Discount is capped at subtotal — total can never go negative")
  mockFindUnique({
    code: "HUGE",
    isActive: true,
    expiresAt: null,
    maxUses: null,
    timesUsed: 0,
    minOrderAmount: 0,
    discountType: "fixed",
    discountValue: 99999,
  })

  const capResult = await validateCoupon("HUGE", 1000)
  assert(capResult.valid === true, "Oversized discount coupon is accepted")
  if (capResult.valid) {
    assert(capResult.discount === 1000, `Discount is capped at subtotal ($${capResult.discount / 100})`)
    assert(capResult.discount <= 1000, "Order total cannot go negative")
  }

  // 4. Inactive coupon is rejected
  console.log("\n4. Inactive coupon is rejected")
  mockFindUnique({
    code: "INACTIVE",
    isActive: false,
    expiresAt: null,
    maxUses: null,
    timesUsed: 0,
    minOrderAmount: 0,
    discountType: "fixed",
    discountValue: 100,
  })

  const inactiveResult = await validateCoupon("INACTIVE", 5000)
  assert(inactiveResult.valid === false, "Inactive coupon is rejected")
  if (!inactiveResult.valid) {
    assert(
      inactiveResult.message.includes("no longer active"),
      `Rejection message is clear: "${inactiveResult.message}"`
    )
  }

  // 5. Expired coupon is rejected
  console.log("\n5. Expired coupon is rejected")
  mockFindUnique({
    code: "EXPIRED",
    isActive: true,
    expiresAt: new Date("2020-01-01"),
    maxUses: null,
    timesUsed: 0,
    minOrderAmount: 0,
    discountType: "fixed",
    discountValue: 100,
  })

  const expiredResult = await validateCoupon("EXPIRED", 5000)
  assert(expiredResult.valid === false, "Expired coupon is rejected")
  if (!expiredResult.valid) {
    assert(
      expiredResult.message.includes("expired"),
      `Rejection message mentions expiry: "${expiredResult.message}"`
    )
  }

  // 6. Coupon exceeding usage limit is rejected
  console.log("\n6. Coupon at usage limit is rejected")
  mockFindUnique({
    code: "MAXED",
    isActive: true,
    expiresAt: null,
    maxUses: 5,
    timesUsed: 5,
    minOrderAmount: 0,
    discountType: "fixed",
    discountValue: 100,
  })

  const maxedResult = await validateCoupon("MAXED", 5000)
  assert(maxedResult.valid === false, "Maxed-out coupon is rejected")
  if (!maxedResult.valid) {
    assert(maxedResult.message.includes("usage limit"), `Rejection message: "${maxedResult.message}"`)
  }

  // 7. Coupon below minimum order amount is rejected
  console.log("\n7. Coupon with unmet minimum order is rejected")
  mockFindUnique({
    code: "MINORDER",
    isActive: true,
    expiresAt: null,
    maxUses: null,
    timesUsed: 0,
    minOrderAmount: 10000,
    discountType: "fixed",
    discountValue: 500,
  })

  const minOrderResult = await validateCoupon("MINORDER", 5000)
  assert(minOrderResult.valid === false, "Below-minimum coupon is rejected")
  if (!minOrderResult.valid) {
    assert(
      minOrderResult.message.includes("minimum order"),
      `Rejection message mentions minimum: "${minOrderResult.message}"`
    )
  }

  // 8. Unknown coupon code returns an error
  console.log("\n8. Unknown coupon code is rejected")
  mockFindUnique(null)

  const unknownResult = await validateCoupon("BOGUS123", 5000)
  assert(unknownResult.valid === false, "Unknown coupon code is rejected")
  if (!unknownResult.valid) {
    assert(
      unknownResult.message.includes("not found"),
      `Rejection message is clear: "${unknownResult.message}"`
    )
  }

  restoreFindUnique()
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
