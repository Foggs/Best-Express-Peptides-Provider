import { prisma } from "@/lib/prisma"

export interface CouponValidationResult {
  valid: true
  couponCode: string
  discountType: string
  discountValue: number
  discount: number
  message: string
}

export interface CouponValidationError {
  valid: false
  message: string
}

export type CouponResult = CouponValidationResult | CouponValidationError

/**
 * Validates a coupon code against the database and computes the discount.
 *
 * The discount amount is ALWAYS computed here from the database record.
 * Never trust a discount value supplied by the client.
 *
 * @param code  - The coupon code to validate (case-insensitive).
 * @param subtotal - The order subtotal in cents, used for minimum-order and
 *                   percentage-discount calculations.
 */
export async function validateCoupon(
  code: string,
  subtotal: number,
): Promise<CouponResult> {
  const coupon = await prisma.coupon.findUnique({
    where: { code: code.toUpperCase() },
  })

  if (!coupon) {
    return { valid: false, message: "Coupon code not found" }
  }

  if (!coupon.isActive) {
    return { valid: false, message: "This coupon code is no longer active" }
  }

  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    return { valid: false, message: "This coupon code has expired" }
  }

  if (coupon.maxUses && coupon.timesUsed >= coupon.maxUses) {
    return { valid: false, message: "This coupon code has reached its usage limit" }
  }

  if (subtotal < coupon.minOrderAmount) {
    return {
      valid: false,
      message: `This coupon requires a minimum order of $${(coupon.minOrderAmount / 100).toFixed(2)}`,
    }
  }

  let discount = 0
  if (coupon.discountType === "percentage") {
    discount = Math.floor((subtotal * coupon.discountValue) / 100)
  } else if (coupon.discountType === "fixed") {
    discount = coupon.discountValue
  }

  // Discount cannot exceed the subtotal
  if (discount > subtotal) {
    discount = subtotal
  }

  return {
    valid: true,
    couponCode: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    discount,
    message: `Coupon applied! You saved $${(discount / 100).toFixed(2)}`,
  }
}

/**
 * Resolves the coupon discount for the checkout route.
 *
 * This is the ONLY function the checkout handler calls for coupon resolution.
 * Its signature accepts only a coupon CODE string — it is structurally
 * impossible to pass a client-supplied discount amount through this function.
 *
 * If the coupon is invalid or absent, discount is 0 and the order proceeds
 * unblocked (the caller logs a warning).
 *
 * @param couponCode - The code string extracted from the request body, or
 *                     undefined if no coupon was applied.
 * @param subtotal   - The verified server-computed subtotal in cents.
 * @returns          - The server-computed discount and the verified coupon code.
 */
export async function resolveCheckoutDiscount(
  couponCode: string | undefined,
  subtotal: number,
): Promise<{ discount: number; verifiedCouponCode: string | null }> {
  if (!couponCode) {
    return { discount: 0, verifiedCouponCode: null }
  }

  const result = await validateCoupon(couponCode, subtotal)

  if (!result.valid) {
    // Coupon was valid when added to the cart but is now invalid (expired,
    // deactivated, etc.). Proceed without the discount rather than blocking.
    console.warn(`Coupon '${couponCode}' is no longer valid at checkout: ${result.message}`)
    return { discount: 0, verifiedCouponCode: null }
  }

  return { discount: result.discount, verifiedCouponCode: result.couponCode }
}
