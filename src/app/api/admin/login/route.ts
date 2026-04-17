import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { getJwtSecret } from "@/lib/jwt"

export async function POST(request: NextRequest) {
  // getJwtSecret() throws if JWT_SECRET is not set — intentionally outside
  // the catch block so a misconfigured server fails loudly, not silently.
  const jwtSecret = getJwtSecret()

  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      )
    }

    if (!user.password) {
      return NextResponse.json(
        { error: "This account uses OAuth login only" },
        { status: 401 }
      )
    }

    const passwordMatch = await bcrypt.compare(password, user.password)

    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      )
    }

    if (!user.isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      )
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
      },
      jwtSecret,
      { expiresIn: "24h" }
    )

    return NextResponse.json(
      {
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          isAdmin: user.isAdmin,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Admin login error:", error)
    return NextResponse.json(
      { error: "Failed to process login request" },
      { status: 500 }
    )
  }
}
