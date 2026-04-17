import { NextRequest, NextResponse } from "next/server"
import { verifyAdminAuth, createUnauthorizedResponse } from "@/lib/admin-auth"
import { getUncachableGoogleSheetClient } from "@/lib/googleSheets"

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID!

export async function GET(request: NextRequest) {
  const auth = verifyAdminAuth(request)
  if (!auth.valid) {
    return createUnauthorizedResponse()
  }

  const { searchParams } = new URL(request.url)
  const name = searchParams.get("name")?.trim()

  if (!name) {
    return NextResponse.json({ error: "Missing name parameter" }, { status: 400 })
  }

  try {
    const sheets = await getUncachableGoogleSheetClient()
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Products!A:J",
    })

    const rows = response.data.values
    if (!rows || rows.length < 2) {
      return NextResponse.json({ exists: false })
    }

    const headers = rows[0].map((h: string) => h.toString().trim().toLowerCase())
    const nameColIndex = headers.indexOf("name")

    if (nameColIndex === -1) {
      return NextResponse.json({ error: "Could not find name column in Products sheet" }, { status: 500 })
    }

    const normalizedInput = name.toLowerCase()
    const exists = rows.slice(1).some((row) => {
      const cellValue = (row[nameColIndex] ?? "").toString().trim().toLowerCase()
      return cellValue === normalizedInput
    })

    return NextResponse.json({ exists })
  } catch (error) {
    console.error("Error checking product name:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { error: "Failed to check product name", details: message },
      { status: 500 }
    )
  }
}
