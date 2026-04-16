import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { getJwtSecret } from "@/lib/jwt"

export async function POST(request: NextRequest) {
  // getJwtSecret() throws if JWT_SECRET is not set — intentionally outside
  // the catch block so a misconfigured server fails loudly, not silently.
  const jwtSecret = getJwtSecret()

  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      )
    }

    const decoded = jwt.verify(token, jwtSecret)

    if (!(decoded as any).isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        user: decoded,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Token verification error:", error)
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 }
    )
  }
}
