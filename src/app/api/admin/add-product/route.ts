import { NextRequest, NextResponse } from "next/server"
import { verifyAdminAuth, createUnauthorizedResponse } from "@/lib/admin-auth"
import { getUncachableGoogleSheetClient } from "@/lib/googleSheets"
import { clearCache } from "@/lib/productCache"

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID!

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

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
  const auth = verifyAdminAuth(request)
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

    const { name, categories, shortDescription, description, research, variants } = body

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Product name is required" },
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

    const productSlug = slugify(name.trim())
    const rawCategories = (categories || "").trim()
    const resolvedCategory = rawCategories.length > 0 ? rawCategories : "Research Peptide"

    const sheets = await getUncachableGoogleSheetClient()

    const productsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Products!A:J",
    })

    const rows = productsResponse.data.values || []

    if (rows.length >= 1) {
      const headers = rows[0].map((h: string) => h.trim().toLowerCase())
      const slugColIndex = headers.indexOf("slug")

      if (slugColIndex !== -1) {
        for (let i = 1; i < rows.length; i++) {
          const existingSlug = (rows[i][slugColIndex] || "").trim().toLowerCase()
          if (existingSlug === productSlug) {
            return NextResponse.json(
              { success: false, error: `A product with slug "${productSlug}" already exists` },
              { status: 409 }
            )
          }
        }
      }
    }

    const productRow = [
      name.trim(),
      productSlug,
      resolvedCategory,
      (shortDescription || "").trim(),
      (description || "").trim(),
      (research || "").trim(),
      "",
      "",
      "false",
      "true",
    ]

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Products",
      valueInputOption: "RAW",
      requestBody: {
        values: [productRow],
      },
    })

    const variantRows = variants.map((v: any) => [
      productSlug,
      v.variantName.trim(),
      String(parseFloat(v.price)),
      generateSku(productSlug, v.variantName.trim()),
      String(parseInt(v.stock, 10)),
    ])

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Variants",
      valueInputOption: "RAW",
      requestBody: {
        values: variantRows,
      },
    })

    clearCache()

    return NextResponse.json({
      success: true,
      slug: productSlug,
      name: name.trim(),
      variantCount: variantRows.length,
    })
  } catch (error) {
    console.error("Error adding product:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { success: false, error: "Failed to add product", details: message },
      { status: 500 }
    )
  }
}
