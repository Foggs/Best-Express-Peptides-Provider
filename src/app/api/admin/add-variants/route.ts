import { NextRequest, NextResponse } from "next/server"
import { verifyAdminAuth, createUnauthorizedResponse } from "@/lib/admin-auth"
import { getUncachableGoogleSheetClient } from "@/lib/googleSheets"

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID!

function generateSku(productSlug: string, variantName: string): string {
  const slugPart = productSlug
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8)
  const variantPart = variantName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8)
  return `${slugPart}-${variantPart}`
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdminAuth(request)
  if (!auth.valid) {
    return createUnauthorizedResponse()
  }

  try {
    let body: any
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request body" },
        { status: 400 }
      )
    }

    const { productSlug, variants } = body

    if (!productSlug || typeof productSlug !== "string") {
      return NextResponse.json(
        { success: false, error: "productSlug is required" },
        { status: 400 }
      )
    }

    if (!Array.isArray(variants) || variants.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one variant is required" },
        { status: 400 }
      )
    }

    for (const v of variants) {
      const trimmedName = typeof v.variantName === "string" ? v.variantName.trim() : ""
      const trimmedPrice = typeof v.price === "string" ? v.price.trim() : String(v.price ?? "")
      const trimmedStock = typeof v.stock === "string" ? v.stock.trim() : String(v.stock ?? "")
      if (!trimmedName || !trimmedPrice || !trimmedStock) {
        return NextResponse.json(
          { success: false, error: "Each variant must have variantName, price, and stock" },
          { status: 400 }
        )
      }
      const price = parseFloat(trimmedPrice)
      const stock = parseInt(trimmedStock, 10)
      if (isNaN(price) || price <= 0) {
        return NextResponse.json(
          { success: false, error: "Variant price must be greater than $0" },
          { status: 400 }
        )
      }
      if (isNaN(stock) || stock < 0) {
        return NextResponse.json(
          { success: false, error: "Variant stock cannot be negative" },
          { status: 400 }
        )
      }
    }

    if (!SPREADSHEET_ID) {
      return NextResponse.json(
        { success: false, error: "GOOGLE_SHEET_ID is not configured" },
        { status: 500 }
      )
    }

    const sheets = await getUncachableGoogleSheetClient()

    const newRows = variants.map((v: any) => [
      productSlug,
      v.variantName.trim(),
      String(parseFloat(v.price)),
      generateSku(productSlug, v.variantName.trim()),
      String(parseInt(v.stock, 10)),
    ])

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Variants!A:E",
      valueInputOption: "RAW",
      requestBody: {
        values: newRows,
      },
    })

    return NextResponse.json({
      success: true,
      addedCount: newRows.length,
      productSlug,
    })
  } catch (error) {
    console.error("Error adding variants:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { success: false, error: "Failed to add variants", details: message },
      { status: 500 }
    )
  }
}
