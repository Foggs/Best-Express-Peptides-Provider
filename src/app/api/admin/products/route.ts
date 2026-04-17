import { NextRequest, NextResponse } from "next/server"
import { verifyAdminAuth, createUnauthorizedResponse } from "@/lib/admin-auth"
import { getCachedProducts, getCacheStatus } from "@/lib/productCache"

export async function GET(request: NextRequest) {
  const auth = verifyAdminAuth(request)
  if (!auth.valid) {
    return createUnauthorizedResponse()
  }

  try {
    const products = await getCachedProducts()
    const status = getCacheStatus()

    return NextResponse.json({
      products,
      cacheStatus: status,
    })
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json({ error: "Error fetching products" }, { status: 500 })
  }
}
