import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

/**
 * Wraps next-auth's getServerSession as an object property so that tests can
 * replace it without touching the sealed next-auth ESM namespace.
 * Object property mutation works in ESM; named-export reassignment does not.
 */
export const authSession = {
  async getCheckoutSession() {
    return getServerSession(authOptions)
  },
}
