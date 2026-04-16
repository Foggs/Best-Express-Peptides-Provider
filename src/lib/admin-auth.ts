import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { getJwtSecret } from "@/lib/jwt"

export { getJwtSecret } from "@/lib/jwt"

export async function verifyAdminAuth(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return { valid: false, user: null }
  }

  // getJwtSecret() throws if JWT_SECRET is not set — intentionally not caught
  // so a missing environment variable surfaces as a server configuration error,
  // not as a silent auth failure.
  const secret = getJwtSecret()
  const token = authHeader.slice(7)

  try {
    const decoded = jwt.verify(token, secret) as any
    if (!decoded.isAdmin) {
      return { valid: false, user: null }
    }
    return { valid: true, user: decoded }
  } catch {
    return { valid: false, user: null }
  }
}

export function createUnauthorizedResponse() {
  return NextResponse.json(
    { error: "Unauthorized: Admin authentication required" },
    { status: 401 }
  )
}
