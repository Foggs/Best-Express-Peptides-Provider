import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"
import { isSignInRateLimited } from "@/lib/rate-limit"

interface RouteHandlerContext {
  params: Promise<{ nextauth: string[] }>
}

const nextAuthHandler = NextAuth(authOptions)

async function handler(request: NextRequest, context: RouteHandlerContext) {
  const params = await context.params
  const segments = params.nextauth ?? []

  if (
    request.method === "POST" &&
    segments.length === 2 &&
    segments[0] === "callback" &&
    segments[1] === "credentials"
  ) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      "unknown"

    const rateLimitResult = await isSignInRateLimited(ip)
    if (rateLimitResult.limited) {
      return NextResponse.json(
        { error: "Too many failed sign-in attempts. Please try again later." },
        {
          status: 429,
          headers: rateLimitResult.retryAfter
            ? { "Retry-After": String(rateLimitResult.retryAfter) }
            : undefined,
        }
      )
    }
  }

  return nextAuthHandler(request, context)
}

export { handler as GET, handler as POST }
