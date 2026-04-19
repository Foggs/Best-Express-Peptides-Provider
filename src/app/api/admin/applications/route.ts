import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyAdminAuth, createUnauthorizedResponse } from "@/lib/admin-auth"

export async function GET(request: NextRequest) {
  const auth = verifyAdminAuth(request)
  if (!auth.valid) {
    return createUnauthorizedResponse()
  }

  try {
    const applications = await prisma.providerApplication.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        companyName: true,
        npiNumber: true,
        state: true,
        hasResellerLicense: true,
        referredBy: true,
        status: true,
        createdAt: true,
      },
    })
    return NextResponse.json({ applications })
  } catch (err) {
    console.error("Admin applications fetch error:", err)
    return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 })
  }
}
