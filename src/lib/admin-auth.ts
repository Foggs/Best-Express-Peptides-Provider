import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error(
      "JWT_SECRET environment variable is not set. " +
      "Set it to a strong random string before starting the server."
    )
  }
  return secret
}

export async function verifyAdminAuth(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return { valid: false, user: null }
    }

    const token = authHeader.slice(7)
    const decoded = jwt.verify(token, getJwtSecret()) as any

    if (!decoded.isAdmin) {
      return { valid: false, user: null }
    }

    return { valid: true, user: decoded }
  } catch (error) {
    return { valid: false, user: null }
  }
}

export function createUnauthorizedResponse() {
  return NextResponse.json(
    { error: "Unauthorized: Admin authentication required" },
    { status: 401 }
  )
}
