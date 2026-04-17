import {
  getCachedProductBySlug as _getCachedProductBySlug,
  checkStock as _checkStock,
  decrementStock as _decrementStock,
} from "@/lib/productCache"

/**
 * Indirection layer that lets tests replace individual operations without
 * touching the sealed productCache ESM namespace.  Object property mutation
 * works in ESM; named-export reassignment does not.
 */
export const checkoutDeps = {
  getCachedProductBySlug: _getCachedProductBySlug,
  checkStock: _checkStock,
  decrementStock: _decrementStock,
}
