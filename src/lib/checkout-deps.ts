import {
  getCachedProductBySlug as _getCachedProductBySlug,
  checkStock as _checkStock,
  decrementStock as _decrementStock,
} from "@/lib/productCache"
import type { sendOrderEmail, sendLowStockAlert } from "@/lib/orderEmail"

type OrderEmailFn = typeof sendOrderEmail
type LowStockFn = typeof sendLowStockAlert

async function _sendOrderEmail(...args: Parameters<OrderEmailFn>): ReturnType<OrderEmailFn> {
  const { sendOrderEmail: fn } = await import("@/lib/orderEmail")
  return fn(...args)
}

async function _sendLowStockAlert(...args: Parameters<LowStockFn>): ReturnType<LowStockFn> {
  const { sendLowStockAlert: fn } = await import("@/lib/orderEmail")
  return fn(...args)
}

/**
 * Indirection layer that lets tests replace individual operations without
 * touching sealed ESM namespace bindings.  Object property mutation
 * works in ESM; named-export reassignment does not.
 */
export const checkoutDeps = {
  getCachedProductBySlug: _getCachedProductBySlug,
  checkStock: _checkStock,
  decrementStock: _decrementStock,
  sendOrderEmail: _sendOrderEmail as OrderEmailFn,
  sendLowStockAlert: _sendLowStockAlert as LowStockFn,
}
