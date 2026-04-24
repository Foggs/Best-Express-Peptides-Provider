import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { verifyAdminAuth, createUnauthorizedResponse } from "@/lib/admin-auth"
import { clearCache, getCacheStatus, getCachedProducts } from "@/lib/productCache"

export async function POST(request: NextRequest) {
  const auth = verifyAdminAuth(request)
  if (!auth.valid) {
    return createUnauthorizedResponse()
  }

  try {
    const { cleared, previousLastFetched } = clearCache()
    revalidatePath('/peptides', 'layout')
    revalidatePath('/', 'layout')
    const products = await getCachedProducts()
    const status = getCacheStatus()

    return NextResponse.json({
      success: true,
      message: "Product cache refreshed from Google Sheets",
      previousLastFetched,
      newLastFetched: status.lastFetched,
      productCount: status.productCount,
    })
  } catch (error) {
    console.error("Error refreshing product cache:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { success: false, error: "Failed to refresh product cache", details: message },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const auth = verifyAdminAuth(request)
  if (!auth.valid) {
    return createUnauthorizedResponse()
  }

  const status = getCacheStatus()
  return NextResponse.json(status)
}
