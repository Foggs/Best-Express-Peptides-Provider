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
